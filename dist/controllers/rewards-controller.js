"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rewards_view_1 = require("../views/rewards-view");
const middleware_1 = require("../middleware/middleware");
const router = express_1.default.Router();
// ---------------- Reward Routes ----------------
router.get("/total", middleware_1.authenticate, rewards_view_1.getTotalRewards);
router.get("/history", middleware_1.authenticate, rewards_view_1.getRewardHistory);
router.get("/achievements", middleware_1.authenticate, rewards_view_1.getAchievements);
router.get("/badges", middleware_1.authenticate, rewards_view_1.getBadges);
router.get("/leaderboard", middleware_1.authenticate, rewards_view_1.getRewardLeaderboard);
router.post("/claim", middleware_1.authenticate, rewards_view_1.claimReward);
exports.default = router;
