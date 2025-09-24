"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_view_1 = require("../views/modules-view");
const middleware_1 = require("../middleware/middleware");
const router = express_1.default.Router();
// ---------------- Module Routes ----------------
router.get("/ongoing", middleware_1.authenticate, modules_view_1.getOngoingModules);
router.get("/completed", middleware_1.authenticate, modules_view_1.getCompletedModules);
router.get("/new", middleware_1.authenticate, modules_view_1.getNewModules);
router.get("/featured", middleware_1.authenticate, modules_view_1.getFeaturedModules);
router.get("/search", middleware_1.authenticate, modules_view_1.searchModules);
router.get("/", middleware_1.authenticate, modules_view_1.getAllModules);
router.get("/:id", middleware_1.authenticate, modules_view_1.getModuleById);
router.get("/:id/lessons", middleware_1.authenticate, modules_view_1.getModuleLessons);
router.get("/:id/reviews", middleware_1.authenticate, modules_view_1.getModuleReviews);
// ---------------- User Module Progress Routes ----------------
router.post("/:id/continue", middleware_1.authenticate, modules_view_1.continueModule);
router.put("/:id/progress", middleware_1.authenticate, modules_view_1.updateModuleProgress);
// ---------------- Review Routes ----------------
router.post("/:id/reviews", middleware_1.authenticate, modules_view_1.addModuleReview);
exports.default = router;
