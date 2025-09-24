"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_view_1 = require("../views/dashboard-view");
const middleware_1 = require("../middleware/middleware");
const router = express_1.default.Router();
// ---------------- Dashboard Routes ----------------
router.get("/summary", middleware_1.authenticate, dashboard_view_1.getDashboardSummary);
router.get("/profile", middleware_1.authenticate, dashboard_view_1.getUserProfile);
router.put("/profile", middleware_1.authenticate, dashboard_view_1.updateUserProfile);
router.get("/settings", middleware_1.authenticate, dashboard_view_1.getUserSettings);
router.put("/settings", middleware_1.authenticate, dashboard_view_1.updateUserSettings);
// ---------------- Notification Routes ----------------
router.get("/notifications", middleware_1.authenticate, dashboard_view_1.getNotifications);
router.put("/notifications/:id/read", middleware_1.authenticate, dashboard_view_1.markNotificationAsRead);
router.put("/notifications/settings", middleware_1.authenticate, dashboard_view_1.updateNotificationSettings);
exports.default = router;
