"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_view_1 = require("../views/authentication-view");
const router = express_1.default.Router();
// Email & OTP Routes
router.post("/validate-email", authentication_view_1.validateEmail);
router.post("/send-otp", authentication_view_1.sendOtp);
router.post("/verify-otp", authentication_view_1.verifyOtp);
// Account Management
router.post("/create-account", authentication_view_1.createAccount);
router.post("/login", authentication_view_1.login);
router.put("/reset-password", authentication_view_1.resetPassword);
// router.put("/update", updateDetails);
// Google Authentication Service
router.get("/google", authentication_view_1.startGoogleAuth);
router.get("/google/callback", authentication_view_1.googleCallback);
router.get("/google/callback/verify/:id", authentication_view_1.verifyAppToken);
// Add Modules to User
router.get("/get-modules", authentication_view_1.fetchAllModules);
router.post("/assign-modules", authentication_view_1.addModulesToUser);
router.post("/add-modules", authentication_view_1.saveModule);
exports.default = router;
