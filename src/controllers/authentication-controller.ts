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
} from "../views/authentication-view";

const router = express.Router();

// Email & OTP Routes
router.post("/validate-email", validateEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Account Management
router.post("/create-account", createAccount);
router.post("/login", login);
router.put("/reset-password", resetPassword);
// router.put("/update", updateDetails);

// Google Authentication Service
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleCallback);

// Add Modules to User
router.get("/get-modules", fetchAllModules);
router.post("/assign-modules", addModulesToUser);
router.post("/add-modules", saveModule);



export default router;
