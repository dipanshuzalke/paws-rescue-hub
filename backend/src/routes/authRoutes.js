import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me, logout, updateMe, heartbeat, forgotPassword, resetPassword, deleteMe } from "../controllers/authController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from "../utils/validators.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later" },
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);
router.get("/me", authenticateUser, me);
router.post("/logout", authenticateUser, logout);
router.delete("/me", authenticateUser, deleteMe);
router.put("/me", authenticateUser, validate(updateProfileSchema), updateMe);
router.post("/heartbeat", authenticateUser, heartbeat);

export default router;
