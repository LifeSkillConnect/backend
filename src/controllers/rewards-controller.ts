import express from 'express';

import {
  getTotalRewards,
  getRewardHistory,
  claimReward,
  getAchievements,
  getBadges,
  getRewardLeaderboard,
} from "../views/rewards-view";
import { authenticate } from "../middleware/middleware";

const router = express.Router();

// ---------------- Reward Routes ----------------
router.get("/total", authenticate, getTotalRewards);
router.get("/history", authenticate, getRewardHistory);
router.get("/achievements", authenticate, getAchievements);
router.get("/badges", authenticate, getBadges);
router.get("/leaderboard", authenticate, getRewardLeaderboard);
router.post("/claim", authenticate, claimReward);

export default router;
