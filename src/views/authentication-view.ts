import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  CreateAccountPayload,
  SendOtpPayload,
  ValidateEmailPayload,
} from "../types/auth.types";
import { sendEmail } from "../utils/email.utils";

const prisma = new PrismaClient();

// Validate Email
export const validateEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid email format" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email is valid and available",
    });
  } catch (error) {
    console.error("Error validating email:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while validating the email",
    });
  }
};

//Send Otp
export const sendOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, check_exists }: SendOtpPayload = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    const OTP = Math.floor(10000 + Math.random() * 90000).toString();

    // If check_exists is true (e.g., forgot password), validate email exists
    if (check_exists) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return res
          .status(404)
          .json({ success: false, error: "No user found with this email" });
      }
    }

    // Save OTP to DB
    await prisma.otp.create({
      data: {
        email,
        otp: OTP,
        isUsed: false,
      },
    });

    // Send email
    await sendEmail(
      email,
      "Your OTP Code",
      `<p>Your OTP code is: <strong>${OTP}</strong></p>`
    );

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

// Verify Otp
export const verifyOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, otp }: ValidateEmailPayload = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, error: "Email and OTP are required" });
    }

    const foundOtp = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!foundOtp) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    }

    // OPTIONAL: check for expiration (e.g., OTP older than 10 mins)
    const expirationTime = 10 * 60 * 1000; // 10 minutes
    const createdAt = new Date(foundOtp.createdAt).getTime();
    if (Date.now() - createdAt > expirationTime) {
      return res.status(410).json({ success: false, error: "OTP expired" });
    }

    // Mark as used
    await prisma.otp.update({
      where: { id: foundOtp.id },
      data: { isUsed: true },
    });

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verifyOtp : ", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

//Create Account
export const createAccount = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      dateOfBirth,
      fullName,
      howdidyouhearaboutus,
      phoneNumber,
    }: CreateAccountPayload = req.body;

    

  } catch (error) {
    console.error("Error in createAccount:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
