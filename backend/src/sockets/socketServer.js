import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { RescueReport } from "../models/RescueReport.js";

/**
 * ============================================================
 * ACTIVE LIVE TRACKING STATE
 * ============================================================
 *
 * Stores ONLY the current state of an active rescue tracking
 * session in server memory.
 *
 * MongoDB:
 * - Rescue report
 * - Assignment
 * - Status
 * - Evidence
 * - History
 *
 * Memory:
 * - Current live GPS location
 * - Tracking status
 * - Rescuer information
 * - Tracking start time
 *
 * We DO NOT store every GPS update in MongoDB.
 */
const activeTracking = new Map();

/**
 * Example:
 *
 * activeTracking = {
 *   "6aa9183f88a9d68effdc5df1": {
 *      rescueId: "6aa9183f88a9d68effdc5df1",
 *      rescuerId: "6a9f2fad5b1c85302d305820",
 *      rescuerName: "Rakesh123",
 *      rescuerSocketId: "abc123",
 *      location: {
 *        rescueId: "...",
 *        rescuerId: "...",
 *        rescuerName: "Rakesh123",
 *        lat: 21.124356,
 *        lng: 79.002649,
 *        accuracy: 500,
 *        heading: null,
 *        speed: null,
 *        updatedAt: "..."
 *      },
 *      startedAt: "..."
 *   }
 * }
 */


/**
 * ============================================================
 * EXTRACT JWT
 * ============================================================
 *
 * Token can come from:
 *
 * 1. Authorization header
 * 2. Socket.IO auth object
 * 3. Cookie
 */
function extractSocketToken(socket) {
  const authorization =
    socket.handshake.headers?.authorization || "";

  // Authorization: Bearer <token>
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  // Socket.IO auth: { token }
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken.startsWith("Bearer ")
      ? authToken.slice(7)
      : authToken;
  }

  // Cookie
  const cookieHeader =
    socket.handshake.headers?.cookie || "";

  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie) => {
        const [key, ...value] = cookie.trim().split("=");

        return [
          key,
          decodeURIComponent(value.join("=")),
        ];
      }),
    );

    return cookies[env.cookieName] || null;
  }

  return null;
}


/**
 * ============================================================
 * SOCKET AUTHENTICATION
 * ============================================================
 */
async function authenticateSocket(socket, next) {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      return next(
        new Error("Authentication required"),
      );
    }

    const payload = jwt.verify(
      token,
      env.jwtSecret,
    );

    const user = await User.findById(payload.sub);

    if (!user) {
      return next(
        new Error("Account no longer exists"),
      );
    }

    if (
      !user.isActive ||
      user.status === "INACTIVE" ||
      user.status === "SUSPENDED"
    ) {
      return next(
        new Error("Account is inactive"),
      );
    }

    // Attach authenticated user to socket
    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "[socket] Authentication failed:",
      error.message,
    );

    next(
      new Error("Invalid or expired session"),
    );
  }
}


/**
 * ============================================================
 * CHECK RESCUE ACCESS
 * ============================================================
 *
 * IMPORTANT:
 * We intentionally do NOT require IN_PROGRESS here.
 *
 * Viewers need to join before tracking starts so they can
 * receive rescue_tracking_started.
 */
async function canAccessRescue(
  user,
  rescueId,
) {
  const report =
    await RescueReport.findById(rescueId).select(
      "_id reporter assignedRescuer assignedOrganization status",
    );

  if (!report) {
    return false;
  }

  /**
   * ADMIN
   * Can monitor every rescue.
   */
  if (user.role === "ADMIN") {
    return true;
  }

  /**
   * RESCUER
   * Can access only their assigned rescue.
   */
  if (user.role === "RESCUER") {
    const assignment =
      await RescueAssignment.findOne({
        report: rescueId,
        rescuer: user._id,
        status: {
          $in: [
            "ASSIGNED",
            "ACCEPTED",
            "IN_PROGRESS",
          ],
        },
      }).select("_id");

    return Boolean(assignment);
  }

  /**
   * CITIZEN
   * Can monitor only their own report.
   */
  if (user.role === "CITIZEN") {
    return (
      String(report.reporter) ===
      String(user._id)
    );
  }

  /**
   * NGO
   *
   * Requirement:
   * NGO can monitor EVERY rescue.
   */
  if (user.role === "NGO") {
    return true;
  }

  return false;
}


/**
 * ============================================================
 * CREATE SOCKET.IO SERVER
 * ============================================================
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

  /**
   * Authenticate every Socket.IO connection.
   */
  io.use(authenticateSocket);


  /**
   * ==========================================================
   * CONNECTION
   * ==========================================================
   */
  io.on("connection", (socket) => {
    console.log(
      `[socket] Connected: ${socket.id} | ${socket.user.name} | ${socket.user.role}`,
    );


    /**
     * ========================================================
     * JOIN RESCUE ROOM
     * ========================================================
     *
     * Used by:
     * - Rescuer
     * - Citizen
     * - NGO
     * - Admin
     *
     * The viewer can join BEFORE tracking starts.
     *
     * NEW:
     * If tracking is already active, immediately send the
     * current tracking state to this newly joined socket.
     */
    socket.on(
      "join_rescue",
      async (rescueId, callback) => {
        try {
          if (!rescueId) {
            return callback?.({
              success: false,
              message: "Rescue ID is required.",
            });
          }

          const authorized =
            await canAccessRescue(
              socket.user,
              rescueId,
            );

          if (!authorized) {
            return callback?.({
              success: false,
              message:
                "You are not authorized to access this rescue.",
            });
          }

          const room = `rescue:${rescueId}`;

          /**
           * Join rescue room.
           */
          socket.join(room);

          socket.data.rescueRoom = room;

          console.log(
            `[socket] ${socket.user.name} joined ${room}`,
          );

          /**
           * ==================================================
           * NEW:
           * CHECK CURRENT ACTIVE TRACKING STATE
           * ==================================================
           */
          const trackingState =
            activeTracking.get(rescueId);

          if (trackingState) {
            console.log(
              `[tracking] Active tracking found for ${rescueId}`,
            );

            console.log(
              `[tracking] Sending current state to ${socket.user.name}`,
            );

            /**
             * Send current tracking state ONLY to the
             * newly joined socket.
             *
             * This solves the refresh problem.
             */
            socket.emit(
              "rescue_tracking_state",
              {
                rescueId:
                  trackingState.rescueId,

                rescuerId:
                  trackingState.rescuerId,

                rescuerName:
                  trackingState.rescuerName,

                location:
                  trackingState.location,

                startedAt:
                  trackingState.startedAt,
              },
            );
          } else {
            console.log(
              `[tracking] No active tracking for ${rescueId}`,
            );
          }

          callback?.({
            success: true,
            room,
            trackingActive:
              Boolean(trackingState),
          });
        } catch (error) {
          console.error(
            "[socket] join_rescue error:",
            error,
          );

          callback?.({
            success: false,
            message:
              "Unable to join rescue room.",
          });
        }
      },
    );


    /**
     * ========================================================
     * LEAVE RESCUE ROOM
     * ========================================================
     */
    socket.on(
      "leave_rescue",
      (rescueId) => {
        if (!rescueId) {
          return;
        }

        const room = `rescue:${rescueId}`;

        socket.leave(room);

        if (
          socket.data.rescueRoom === room
        ) {
          socket.data.rescueRoom = null;
        }

        console.log(
          `[socket] ${socket.user.name} left ${room}`,
        );
      },
    );


    /**
     * ========================================================
     * START LIVE RESCUE TRACKING
     * ========================================================
     *
     * Only the assigned rescuer can start tracking.
     *
     * Requirements:
     * - RESCUER
     * - Has access to rescue
     * - Rescue is IN_PROGRESS
     * - Assigned rescuer matches current user
     */
    socket.on(
      "rescue_tracking_start",
      async (rescueId, callback) => {
        try {
          /**
           * Only RESCUER can start GPS tracking.
           */
          if (
            socket.user.role !== "RESCUER"
          ) {
            return callback?.({
              success: false,
              message:
                "Only rescuers can start tracking.",
            });
          }

          /**
           * Check access.
           */
          const allowed =
            await canAccessRescue(
              socket.user,
              rescueId,
            );

          if (!allowed) {
            return callback?.({
              success: false,
              message:
                "You cannot access this rescue.",
            });
          }

          /**
           * Get rescue.
           */
          const report =
            await RescueReport.findById(
              rescueId,
            ).select(
              "_id status assignedRescuer",
            );

          if (!report) {
            return callback?.({
              success: false,
              message:
                "Rescue not found.",
            });
          }

          /**
           * Rescue must be IN_PROGRESS.
           */
          if (
            report.status !== "IN_PROGRESS"
          ) {
            return callback?.({
              success: false,
              message:
                "Rescue must be IN_PROGRESS.",
            });
          }

          /**
           * Verify assigned rescuer.
           */
          if (
            String(
              report.assignedRescuer,
            ) !==
            String(socket.user._id)
          ) {
            return callback?.({
              success: false,
              message:
                "You are not assigned to this rescue.",
            });
          }

          const room =
            `rescue:${rescueId}`;

          /**
           * Ensure rescuer is in room.
           */
          socket.join(room);

          /**
           * Store which rescue this socket is
           * currently tracking.
           */
          socket.data.trackingRescueId =
            rescueId;

          /**
           * ==================================================
           * CREATE ACTIVE TRACKING STATE
           * ==================================================
           */
          const trackingState = {
            rescueId,

            rescuerId:
              String(socket.user._id),

            rescuerName:
              socket.user.name,

            /**
             * Important:
             * Store socket ID so that an old socket cannot
             * accidentally delete a newer tracking session.
             */
            rescuerSocketId:
              socket.id,

            /**
             * No GPS location yet.
             * It will be filled by rescue_location_update.
             */
            location: null,

            startedAt:
              new Date().toISOString(),
          };

          /**
           * Store/replace current active tracking.
           */
          activeTracking.set(
            rescueId,
            trackingState,
          );

          console.log(
            "[tracking] Active tracking created:",
            trackingState,
          );

          /**
           * ==================================================
           * NOTIFY ALL CURRENT ROOM MEMBERS
           * ==================================================
           */
          io.to(room).emit(
            "rescue_tracking_started",
            {
              rescueId,

              rescuerId:
                String(socket.user._id),

              rescuerName:
                socket.user.name,

              startedAt:
                trackingState.startedAt,
            },
          );

          /**
           * Confirm to rescuer.
           */
          callback?.({
            success: true,
            message:
              "Live tracking started.",
          });
        } catch (error) {
          console.error(
            "[tracking] start error:",
            error,
          );

          callback?.({
            success: false,
            message:
              "Failed to start tracking.",
          });
        }
      },
    );


    /**
     * ========================================================
     * LIVE GPS LOCATION UPDATE
     * ========================================================
     *
     * GPS data is:
     *
     * 1. Validated
     * 2. Stored as CURRENT state in memory
     * 3. Broadcast to rescue room
     *
     * It is NOT stored in MongoDB.
     */
    socket.on(
      "rescue_location_update",
      (payload, callback) => {
        try {
          /**
           * Only RESCUER can send GPS.
           */
          if (
            socket.user.role !== "RESCUER"
          ) {
            return callback?.({
              success: false,
              message:
                "Only rescuers can send location updates.",
            });
          }

          /**
           * Validate payload.
           */
          if (
            !payload ||
            typeof payload !== "object"
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid location payload.",
            });
          }

          const {
            rescueId,
            lat,
            lng,
            accuracy,
            heading,
            speed,
          } = payload;

          /**
           * Rescue ID required.
           */
          if (!rescueId) {
            return callback?.({
              success: false,
              message:
                "Rescue ID is required.",
            });
          }

          /**
           * ==================================================
           * SECURITY CHECK
           * ==================================================
           *
           * A rescuer cannot send GPS for a rescue unless
           * this socket started tracking it.
           */
          if (
            socket.data.trackingRescueId !==
            rescueId
          ) {
            return callback?.({
              success: false,
              message:
                "Live tracking has not been started for this rescue.",
            });
          }

          /**
           * ==================================================
           * VALIDATE LAT/LNG
           * ==================================================
           */
          if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return callback?.({
              success: false,
              message:
                "Latitude and longitude must be valid numbers.",
            });
          }

          if (
            lat < -90 ||
            lat > 90
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid latitude.",
            });
          }

          if (
            lng < -180 ||
            lng > 180
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid longitude.",
            });
          }

          /**
           * ==================================================
           * VALIDATE ACCURACY
           * ==================================================
           */
          if (
            accuracy !== undefined &&
            accuracy !== null &&
            (
              typeof accuracy !== "number" ||
              !Number.isFinite(accuracy) ||
              accuracy < 0
            )
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid GPS accuracy.",
            });
          }

          /**
           * ==================================================
           * VALIDATE HEADING
           * ==================================================
           */
          if (
            heading !== undefined &&
            heading !== null &&
            (
              typeof heading !== "number" ||
              !Number.isFinite(heading)
            )
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid heading.",
            });
          }

          /**
           * ==================================================
           * VALIDATE SPEED
           * ==================================================
           */
          if (
            speed !== undefined &&
            speed !== null &&
            (
              typeof speed !== "number" ||
              !Number.isFinite(speed)
            )
          ) {
            return callback?.({
              success: false,
              message:
                "Invalid speed.",
            });
          }

          const room =
            `rescue:${rescueId}`;

          /**
           * ==================================================
           * CREATE LOCATION OBJECT
           * ==================================================
           */
          const location = {
            rescueId,

            rescuerId:
              String(socket.user._id),

            rescuerName:
              socket.user.name,

            lat,
            lng,

            accuracy:
              accuracy ?? null,

            heading:
              heading ?? null,

            speed:
              speed ?? null,

            updatedAt:
              new Date().toISOString(),
          };

          /**
           * ==================================================
           * UPDATE CURRENT IN-MEMORY STATE
           * ==================================================
           */
          const trackingState =
            activeTracking.get(
              rescueId,
            );

          if (trackingState) {
            /**
             * Update ONLY the latest location.
             */
            trackingState.location =
              location;

            /**
             * Make sure the active state belongs
             * to this socket.
             */
            trackingState.rescuerSocketId =
              socket.id;

            activeTracking.set(
              rescueId,
              trackingState,
            );
          } else {
            /**
             * Safety fallback.
             *
             * Normally this should never happen because
             * tracking must be started first.
             */
            console.warn(
              `[tracking] No active state found for ${rescueId}`,
            );

            activeTracking.set(
              rescueId,
              {
                rescueId,

                rescuerId:
                  String(socket.user._id),

                rescuerName:
                  socket.user.name,

                rescuerSocketId:
                  socket.id,

                location,

                startedAt:
                  new Date().toISOString(),
              },
            );
          }

          /**
           * ==================================================
           * DEBUG
           * ==================================================
           */
          console.log(
            "[tracking] Broadcasting location to room:",
            room,
          );

          console.log(
            "[tracking] ROOM MEMBERS:",
            Array.from(
              io.sockets.adapter.rooms.get(
                room,
              ) ?? [],
            ),
          );

          console.log(
            "[tracking] LOCATION:",
            location,
          );

          /**
           * ==================================================
           * BROADCAST LIVE LOCATION
           * ==================================================
           *
           * Everyone currently watching this rescue gets
           * the latest location.
           */
          io.to(room).emit(
            "rescue_location_updated",
            location,
          );

          /**
           * Confirm to sender.
           */
          callback?.({
            success: true,
          });
        } catch (error) {
          console.error(
            "[socket] rescue_location_update error:",
            error,
          );

          callback?.({
            success: false,
            message:
              "Unable to update rescue location.",
          });
        }
      },
    );


    /**
     * ========================================================
     * STOP LIVE RESCUE TRACKING
     * ========================================================
     *
     * Called when:
     * - Rescue is completed
     * - Rescuer stops driving
     * - Tracking hook stops
     */
    socket.on(
      "rescue_tracking_stop",
      async (rescueId, callback) => {
        try {
          /**
           * Only RESCUER can stop tracking.
           */
          if (
            socket.user.role !== "RESCUER"
          ) {
            return callback?.({
              success: false,
              message:
                "Only rescuers can stop live tracking.",
            });
          }

          if (!rescueId) {
            return callback?.({
              success: false,
              message:
                "Rescue ID is required.",
            });
          }

          /**
           * Make sure this socket is tracking this rescue.
           */
          if (
            socket.data.trackingRescueId !==
            rescueId
          ) {
            return callback?.({
              success: false,
              message:
                "This rescue is not being tracked by this socket.",
            });
          }

          const room =
            `rescue:${rescueId}`;

          /**
           * Remove socket's tracking association.
           */
          socket.data.trackingRescueId =
            null;

          /**
           * ==================================================
           * REMOVE ACTIVE MEMORY STATE
           * ==================================================
           *
           * Only delete if this socket owns the active
           * tracking state.
           */
          const trackingState =
            activeTracking.get(
              rescueId,
            );

          if (
            trackingState &&
            trackingState.rescuerSocketId ===
              socket.id
          ) {
            activeTracking.delete(
              rescueId,
            );

            console.log(
              `[tracking] Active state removed: ${rescueId}`,
            );
          }

          /**
           * Notify viewers.
           */
          io.to(room).emit(
            "rescue_tracking_stopped",
            {
              rescueId,

              rescuerId:
                String(socket.user._id),

              rescuerName:
                socket.user.name,

              stoppedAt:
                new Date().toISOString(),
            },
          );

          console.log(
            `[socket] ${socket.user.name} stopped tracking ${rescueId}`,
          );

          callback?.({
            success: true,
            message:
              "Live tracking stopped.",
          });
        } catch (error) {
          console.error(
            "[socket] rescue_tracking_stop error:",
            error,
          );

          callback?.({
            success: false,
            message:
              "Unable to stop live tracking.",
          });
        }
      },
    );


    /**
     * ========================================================
     * DISCONNECT
     * ========================================================
     *
     * If rescuer closes browser, refreshes, loses connection,
     * etc., notify viewers and remove active tracking state.
     */
    socket.on(
      "disconnect",
      (reason) => {
        const trackingRescueId =
          socket.data.trackingRescueId;

        if (trackingRescueId) {
          const room =
            `rescue:${trackingRescueId}`;

          /**
           * Notify viewers.
           */
          io.to(room).emit(
            "rescue_tracking_stopped",
            {
              rescueId:
                trackingRescueId,

              rescuerId:
                String(socket.user._id),

              rescuerName:
                socket.user.name,

              stoppedAt:
                new Date().toISOString(),

              reason: "disconnect",
            },
          );

          /**
           * ==================================================
           * REMOVE MEMORY STATE
           * ==================================================
           *
           * Important:
           * Only delete if this socket still owns the
           * active tracking state.
           */
          const trackingState =
            activeTracking.get(
              trackingRescueId,
            );

          if (
            trackingState &&
            trackingState.rescuerSocketId ===
              socket.id
          ) {
            activeTracking.delete(
              trackingRescueId,
            );

            console.log(
              `[tracking] Removed active state after disconnect: ${trackingRescueId}`,
            );
          }

          console.log(
            `[socket] Tracking disconnected for ${trackingRescueId}`,
          );
        }

        console.log(
          `[socket] Disconnected: ${socket.id} | ${socket.user.name} | ${reason}`,
        );
      },
    );
  });


  /**
   * Return Socket.IO instance.
   */
  return io;
}