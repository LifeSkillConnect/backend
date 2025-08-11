import express from "express";
import { sendOtp, validateEmail, verifyOtp } from "../views/authentication-view";

const router = express.Router();

router.post("/validate-email", validateEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
