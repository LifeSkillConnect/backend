import express from 'express';

import {
  getAllModules,
  getOngoingModules,
  getCompletedModules,
  getModuleById,
  getModuleLessons,
  continueModule,
  updateModuleProgress,
  searchModules,
  getFeaturedModules,
  getModuleReviews,
  addModuleReview,
  getNewModules,
} from "../views/modules-view";
import { authenticate } from "../middleware/middleware";

const router = express.Router();

// ---------------- Module Routes ----------------
router.get("/ongoing", authenticate, getOngoingModules);
router.get("/completed", authenticate, getCompletedModules);
router.get("/new", authenticate, getNewModules);
router.get("/featured", authenticate, getFeaturedModules);
router.get("/search", authenticate, searchModules);
router.get("/", authenticate, getAllModules);
router.get("/:id", authenticate, getModuleById);
router.get("/:id/lessons", authenticate, getModuleLessons);
router.get("/:id/reviews", authenticate, getModuleReviews);

// ---------------- User Module Progress Routes ----------------
router.post("/:id/continue", authenticate, continueModule);
router.put("/:id/progress", authenticate, updateModuleProgress);

// ---------------- Review Routes ----------------
router.post("/:id/reviews", authenticate, addModuleReview);

export default router;
