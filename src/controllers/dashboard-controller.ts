import express from 'express';

import {
  getDashboardSummary,
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  getNotifications,
  markNotificationAsRead,
  updateNotificationSettings,
} from "../views/dashboard-view";
import { authenticate } from "../middleware/middleware";

const router = express.Router();

// ---------------- Dashboard Routes ----------------
router.get("/summary", authenticate, getDashboardSummary);
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);
router.get("/settings", authenticate, getUserSettings);
router.put("/settings", authenticate, updateUserSettings);

// ---------------- Notification Routes ----------------
router.get("/notifications", authenticate, getNotifications);
router.put("/notifications/:id/read", authenticate, markNotificationAsRead);
router.put("/notifications/settings", authenticate, updateNotificationSettings);

export default router;
