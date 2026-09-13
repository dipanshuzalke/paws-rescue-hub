import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { RescueReport } from "../models/RescueReport.js";

/**
 * Extract JWT from:
 * 1. Authorization header
 * 2. Socket.IO auth object
 * 3. Cookie
 */
function extractSocketToken(socket) {
  const authorization = socket.handshake.headers?.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  const cookieHeader = socket.handshake.headers?.cookie || "";

  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie) => {
        const [key, ...value] = cookie.trim().split("=");

        return [key, decodeURIComponent(value.join("="))];
      }),
    );

    return cookies[env.cookieName] || null;
  }

  return null;
}

/**
 * Authenticate Socket.IO connection using existing JWT.
 */
async function authenticateSocket(socket, next) {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = jwt.verify(token, env.jwtSecret);

    const user = await User.findById(payload.sub);

    if (!user) {
      return next(new Error("Account no longer exists"));
    }

    if (!user.isActive || user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return next(new Error("Account is inactive"));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error("[socket] Authentication failed:", error.message);

    next(new Error("Invalid or expired session"));
  }
}

/**
 * Check whether the authenticated user can access a rescue.
 *
 * IMPORTANT:
 * We intentionally do NOT require IN_PROGRESS here.
 *
 * Citizens / NGOs / Admins need to be able to join the rescue room
 * before tracking starts so that they can receive the
 * rescue_tracking_started event.
 */
async function canAccessRescue(user, rescueId) {
  const report = await RescueReport.findById(rescueId).select(
    "_id reporter assignedRescuer assignedOrganization status",
  );

  if (!report) {
    return false;
  }

  // ADMIN → can monitor all rescues
  if (user.role === "ADMIN") {
    return true;
  }

  // RESCUER → only their assigned rescue
  if (user.role === "RESCUER") {
    const assignment = await RescueAssignment.findOne({
      report: rescueId,
      rescuer: user._id,
      status: {
        $in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
      },
    }).select("_id");

    return Boolean(assignment);
  }

  // CITIZEN → only their own report
  if (user.role === "CITIZEN") {
    return String(report.reporter) === String(user._id);
  }

  // NGO → only their organization's rescue
  if (user.role === "NGO") {
    return Boolean(
      report.assignedOrganization &&
      user.organization &&
      String(report.assignedOrganization) === String(user.organization),
    );
  }

  return false;
}

/**
 * Create Socket.IO server.
 */
export function createSocketServer(httpServer) {
  const allowedOrigins = env.clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authenticate every socket connection.
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`[socket] Connected: ${socket.id} | ${socket.user.name} | ${socket.user.role}`);

    /**
     * JOIN RESCUE ROOM
     *
     * Used by:
     * - Rescuer
     * - Citizen
     * - NGO
     * - Admin
     *
     * This can happen before tracking starts.
     */
    socket.on("join_rescue", async (rescueId, callback) => {
      try {
        if (!rescueId) {
          return callback?.({
            success: false,
            message: "Rescue ID is required.",
          });
        }

        const authorized = await canAccessRescue(socket.user, rescueId);

        if (!authorized) {
          return callback?.({
            success: false,
            message: "You are not authorized to access this rescue.",
          });
        }

        const room = `rescue:${rescueId}`;

        socket.join(room);

        socket.data.rescueRoom = room;

        console.log(`[socket] ${socket.user.name} joined ${room}`);

        callback?.({
          success: true,
          room,
        });
      } catch (error) {
        console.error("[socket] join_rescue error:", error);

        callback?.({
          success: false,
          message: "Unable to join rescue room.",
        });
      }
    });

    /**
     * LEAVE RESCUE ROOM
     */
    socket.on("leave_rescue", (rescueId) => {
      if (!rescueId) {
        return;
      }

      const room = `rescue:${rescueId}`;

      socket.leave(room);

      if (socket.data.rescueRoom === room) {
        socket.data.rescueRoom = null;
      }

      console.log(`[socket] ${socket.user.name} left ${room}`);
    });

    /**
     * START LIVE RESCUE TRACKING
     *
     * Only the assigned rescuer can start tracking.
     *
     * Requirements:
     * - User must be RESCUER
     * - User must have access to the rescue
     * - Rescue must be IN_PROGRESS
     * - User must be the assigned rescuer
     */
    socket.on("rescue_tracking_start", async (rescueId, callback) => {
      try {
        if (socket.user.role !== "RESCUER") {
          return callback?.({
            success: false,
            message: "Only rescuers can start live tracking.",
          });
        }

        if (!rescueId) {
          return callback?.({
            success: false,
            message: "Rescue ID is required.",
          });
        }

        const authorized = await canAccessRescue(socket.user, rescueId);

        if (!authorized) {
          return callback?.({
            success: false,
            message: "You are not authorized to track this rescue.",
          });
        }

        const report = await RescueReport.findById(rescueId).select("_id status assignedRescuer");

        if (!report) {
          return callback?.({
            success: false,
            message: "Rescue not found.",
          });
        }

        /**
         * IMPORTANT:
         * Live tracking only starts after the rescuer
         * has moved the rescue to IN_PROGRESS.
         */
        if (report.status !== "IN_PROGRESS") {
          return callback?.({
            success: false,
            message: "Live tracking is only available while the rescue is in progress.",
          });
        }

        /**
         * Security check:
         * The current socket user must actually be
         * the assigned rescuer.
         */
        if (!report.assignedRescuer || String(report.assignedRescuer) !== String(socket.user._id)) {
          return callback?.({
            success: false,
            message: "You are not the assigned rescuer for this rescue.",
          });
        }

        const room = `rescue:${rescueId}`;

        console.log(
          "[tracking] ROOM MEMBERS:",
          room,
          Array.from(io.sockets.adapter.rooms.get(room) ?? []),
        );

        // Make sure rescuer is inside the room.
        socket.join(room);

        // Remember which rescue this socket is tracking.
        socket.data.trackingRescueId = rescueId;

        console.log(`[socket] ${socket.user.name} started tracking ${rescueId}`);

        /**
         * Tell everyone watching this rescue that
         * live tracking has started.
         */
        io.to(room).emit("rescue_tracking_started", {
          rescueId,
          rescuerId: String(socket.user._id),
          rescuerName: socket.user.name,
          startedAt: new Date().toISOString(),
        });

        callback?.({
          success: true,
          message: "Live tracking started.",
        });
      } catch (error) {
        console.error("[socket] rescue_tracking_start error:", error);

        callback?.({
          success: false,
          message: "Unable to start live tracking.",
        });
      }
    });

    /**
     * LIVE GPS LOCATION UPDATE
     *
     * High-frequency GPS updates are NOT stored in MongoDB.
     * They are broadcast through Socket.IO only.
     */
    socket.on("rescue_location_update", (payload, callback) => {
      try {
        if (socket.user.role !== "RESCUER") {
          return callback?.({
            success: false,
            message: "Only rescuers can send location updates.",
          });
        }

        if (!payload || typeof payload !== "object") {
          return callback?.({
            success: false,
            message: "Invalid location payload.",
          });
        }

        const { rescueId, lat, lng, accuracy, heading, speed } = payload;

        if (!rescueId) {
          return callback?.({
            success: false,
            message: "Rescue ID is required.",
          });
        }

        /**
         * Prevent a rescuer from sending GPS data
         * for a rescue they did not start tracking.
         */
        if (socket.data.trackingRescueId !== rescueId) {
          return callback?.({
            success: false,
            message: "Live tracking has not been started for this rescue.",
          });
        }

        /**
         * Validate coordinates.
         */
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return callback?.({
            success: false,
            message: "Latitude and longitude must be valid numbers.",
          });
        }

        if (lat < -90 || lat > 90) {
          return callback?.({
            success: false,
            message: "Invalid latitude.",
          });
        }

        if (lng < -180 || lng > 180) {
          return callback?.({
            success: false,
            message: "Invalid longitude.",
          });
        }

        /**
         * Validate optional GPS values.
         */
        if (
          accuracy !== undefined &&
          accuracy !== null &&
          (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0)
        ) {
          return callback?.({
            success: false,
            message: "Invalid GPS accuracy.",
          });
        }

        if (
          heading !== undefined &&
          heading !== null &&
          (typeof heading !== "number" || !Number.isFinite(heading))
        ) {
          return callback?.({
            success: false,
            message: "Invalid heading.",
          });
        }

        if (
          speed !== undefined &&
          speed !== null &&
          (typeof speed !== "number" || !Number.isFinite(speed))
        ) {
          return callback?.({
            success: false,
            message: "Invalid speed.",
          });
        }

        const room = `rescue:${rescueId}`;

        const location = {
          rescueId,
          rescuerId: String(socket.user._id),
          rescuerName: socket.user.name,
          lat,
          lng,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          updatedAt: new Date().toISOString(),
        };

        /**
         * Broadcast current rescuer location
         * to everyone watching this rescue.
         */

        io.to(room).emit("rescue_location_updated", location);

        callback?.({
          success: true,
        });
      } catch (error) {
        console.error("[socket] rescue_location_update error:", error);

        callback?.({
          success: false,
          message: "Unable to update rescue location.",
        });
      }
    });

    /**
     * STOP LIVE RESCUE TRACKING
     *
     * Called when:
     * - Rescue is completed
     * - Rescuer leaves tracking
     * - Component unmounts
     */
    socket.on("rescue_tracking_stop", async (rescueId, callback) => {
      try {
        if (socket.user.role !== "RESCUER") {
          return callback?.({
            success: false,
            message: "Only rescuers can stop live tracking.",
          });
        }

        if (!rescueId) {
          return callback?.({
            success: false,
            message: "Rescue ID is required.",
          });
        }

        if (socket.data.trackingRescueId !== rescueId) {
          return callback?.({
            success: false,
            message: "This rescue is not being tracked by this socket.",
          });
        }

        const room = `rescue:${rescueId}`;

        socket.data.trackingRescueId = null;

        io.to(room).emit("rescue_tracking_stopped", {
          rescueId,
          rescuerId: String(socket.user._id),
          rescuerName: socket.user.name,
          stoppedAt: new Date().toISOString(),
        });

        console.log(`[socket] ${socket.user.name} stopped tracking ${rescueId}`);

        callback?.({
          success: true,
          message: "Live tracking stopped.",
        });
      } catch (error) {
        console.error("[socket] rescue_tracking_stop error:", error);

        callback?.({
          success: false,
          message: "Unable to stop live tracking.",
        });
      }
    });

    /**
     * DISCONNECT
     *
     * If the rescuer closes the browser or loses the
     * Socket.IO connection while tracking, notify viewers.
     */
    socket.on("disconnect", (reason) => {
      const trackingRescueId = socket.data.trackingRescueId;

      if (trackingRescueId) {
        const room = `rescue:${trackingRescueId}`;

        io.to(room).emit("rescue_tracking_stopped", {
          rescueId: trackingRescueId,
          rescuerId: String(socket.user._id),
          rescuerName: socket.user.name,
          stoppedAt: new Date().toISOString(),
          reason: "disconnect",
        });

        console.log(`[socket] Tracking disconnected for ${trackingRescueId}`);
      }

      console.log(`[socket] Disconnected: ${socket.id} | ${socket.user.name} | ${reason}`);
    });
  });

  return io;
}
