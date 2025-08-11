import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  CreateAccountPayload,
  GoogleUserProfile,
  SendOtpPayload,
  ValidateEmailPayload,
} from "../types/auth.types";
import * as yup from "yup";
import { sendEmail } from "../utils/email.utils";
import {
  createAccountSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "../validation/auth-schema";
import axios from "axios";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3000/api/v1/auth/google/callback";

// Step 1: Redirect user to Google OAuth consent screen
export const startGoogleAuth = (req: Request, res: Response) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
  res.redirect(url);
};

// Step 2: Handle Google's callback with "code"
export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    console.error("No authorization code provided");
    return res.redirect("/login");
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, id_token } = tokenResponse.data;

    // Retrieve user's profile
    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const {
      email,
      family_name,
      given_name,
      id,
      name,
      picture,
      verified_email,
    } = profileResponse.data as GoogleUserProfile;

    // TODO: Authenticate or create the user in your DB
    // Example: await saveUser(profile);

    let isPresent = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!isPresent) {
      isPresent = await prisma.user.create({
        data: {
          email,
          fullname: name,
          isActive: true,
          role: "USER",
          authProvider: "GOOGLE",
          profilePicture: picture,
        },
      });
    }

    const token = jwt.sign(
      { userId: isPresent.id, email: isPresent.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: token,
    });
  } catch (error: any) {
    console.error(
      "Error during Google OAuth:",
      error?.response?.data || error.message
    );
    res.redirect("/login");
  }
};

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
    if (check_exists == true) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return res
          .status(404)
          .json({ success: false, error: "No user found with this email" });
      }
    }

    // Save OTP to DB
    const isPresent = await prisma.otp.findFirst({
      where: {
        email,
        isUsed: false,
      },
    });

    if (!isPresent) {
      // If no existing OTP, create a new one
      await prisma.otp.create({
        data: {
          email,
          otp: OTP,
          isUsed: false,
        },
      });
    } else {
      // If an existing OTP is found, update it
      await prisma.otp.update({
        where: { id: isPresent.id },
        data: { otp: OTP, isUsed: false },
      });
    }

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
    await createAccountSchema.validate(req.body, { abortEarly: false });

    const {
      email,
      password,
      dateOfBirth,
      fullName,
      howdidyouhearaboutus,
      phoneNumber,
    }: CreateAccountPayload = req.body;

    // Your account creation logic here
    // e.g., save to database, hash password, etc.

    const isPresent = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isPresent) {
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        dateOfBirth: new Date(dateOfBirth),
        fullname: fullName,
        isActive: true,
        role: "USER",
        authProvider: "EMAIL",
        howdidyouhearaboutus,
        phoneNumber,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Error in createAccount:", error);

    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Login or Sign In
export const login = async (req: Request, res: Response) => {
  try {
    // ✅ Validate request body
    await loginSchema.validate(req.body, { abortEarly: false });
    const { email, password } = req.body;

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    // ✅ Prevent password login for Google/Apple accounts
    if (user.authProvider === "GOOGLE" || user.authProvider === "APPLE") {
      return res.status(400).json({
        message: `This account was created using ${user.authProvider}. Please log in with ${user.authProvider} instead.`,
      });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: token,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDetails = async (req: Request, res: Response) => {
  try {
    // Validate request body
    await updateUserSchema.validate(req.body, { abortEarly: false });

    const { email, ...body } = req.body;

    // Find user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Block Google/Apple accounts if needed
    if (
      existingUser.authProvider &&
      ["google", "apple"].includes(existingUser.authProvider)
    ) {
      return res.status(403).json({
        message: "Cannot manually update Google/Apple linked accounts",
      });
    }

    // Remove null/empty values
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined && value !== "") {
        updates[key] = value;
      }
    }

    // Only keep changed values
    const finalUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if ((existingUser as any)[key] !== value) {
        finalUpdates[key] = value;
      }
    }

    // If no changes, return user without updating
    if (Object.keys(finalUpdates).length === 0) {
      return res.status(200).json({ user: existingUser });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: finalUpdates,
    });

    res.status(200).json({
      message: "Details updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        errors: error.errors,
      });
    }
    console.error("Update details error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Validate request body
    await resetPasswordSchema.validate(req.body, { abortEarly: false });
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if account is Google/Apple
    if (user.authProvider && user.authProvider !== "EMAIL") {
      return res.status(400).json({
        success: false,
        message: `Password reset is not available for ${user.authProvider} accounts`,
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
