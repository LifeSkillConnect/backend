import express from 'express';

import {
  getSubscriptionStatus,
  upgradeToPremium,
  getSubscriptionBenefits,
  cancelSubscription,
  getSubscriptionHistory,
} from "../views/subscription-view";
import { authenticate } from "../middleware/middleware";

const router = express.Router();

// ---------------- Subscription Routes ----------------
router.get("/status", authenticate, getSubscriptionStatus);
router.get("/benefits", authenticate, getSubscriptionBenefits);
router.get("/history", authenticate, getSubscriptionHistory);
router.post("/upgrade", authenticate, upgradeToPremium);
router.post("/cancel", authenticate, cancelSubscription);

export default router;
