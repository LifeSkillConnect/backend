"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscription_view_1 = require("../views/subscription-view");
const middleware_1 = require("../middleware/middleware");
const router = express_1.default.Router();
// ---------------- Subscription Routes ----------------
router.get("/status", middleware_1.authenticate, subscription_view_1.getSubscriptionStatus);
router.get("/benefits", middleware_1.authenticate, subscription_view_1.getSubscriptionBenefits);
router.get("/history", middleware_1.authenticate, subscription_view_1.getSubscriptionHistory);
router.post("/upgrade", middleware_1.authenticate, subscription_view_1.upgradeToPremium);
router.post("/cancel", middleware_1.authenticate, subscription_view_1.cancelSubscription);
exports.default = router;
