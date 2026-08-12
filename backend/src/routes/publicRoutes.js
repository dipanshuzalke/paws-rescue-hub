import { Router } from "express";
import {
  getRescueCases,
  getRescueCaseById,
  getPublicStats,
  getPublicOrganizations,
} from "../controllers/publicController.js";

const router = Router();

router.get("/rescue-cases", getRescueCases);
router.get("/rescue-cases/:reportId", getRescueCaseById);
router.get("/stats", getPublicStats);
router.get("/organizations", getPublicOrganizations);

export default router;
