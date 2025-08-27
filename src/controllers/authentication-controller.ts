import express from "express";
import {
  validateEmail,
  sendOtp,
  verifyOtp,
  createAccount,
  login,
  //   updateDetails,
  startGoogleAuth,
  googleCallback,
  resetPassword,
  fetchAllModules,
  addModulesToUser,
  saveModule,
  getProfile,
  verifyAppTokenSiginIn,
  verifyAppTokenSiginUp,
  finishSignup,
} from "../views/authentication-view";
import { authenticate } from "../middleware/middleware";

const router = express.Router();

// Email & OTP Routes
router.post("/validate-email", validateEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Account Management
router.post("/create-account", createAccount);
router.post("/login", login);
router.put("/reset-password", resetPassword);
router.get("/profile", authenticate, getProfile);
router.get("/finish", authenticate, finishSignup);
// router.put("/update", updateDetails);

// Google Authentication Service
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleCallback);
router.get("/google/callback/verify/:id", verifyAppTokenSiginIn);
router.get("/google/callback/verify-2/:id", verifyAppTokenSiginUp);

// Add Modules to User
router.get("/get-modules", fetchAllModules);
router.post("/assign-modules", addModulesToUser);
router.post("/add-modules", saveModule);

export default router;
