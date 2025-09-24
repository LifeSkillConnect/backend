import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as yup from "yup";
import { sendEmail } from "../utils/email.utils";
import {
  createAccountSchema,
  finishSignupSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "../validation/auth-schema";
import { db, DatabaseUser, CreateUserData, CreateOtpData, CreateModuleData } from "../services/supabase-database.service";
import { supabase, supabaseAdmin } from "../config/supabase";

// Google OAuth Configuration (Legacy - will be replaced by Supabase)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const MOBILE_APP_SCHEME = process.env.MOBILE_APP_SCHEME || "lifeskillsconnect://";

// Validate Email
export const validateEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ email });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email is available",
    });
  } catch (error) {
    console.error("Error in validateEmail:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Send OTP
export const sendOtp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email }: { email: string } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Missing email configuration");
      return res.status(500).json({ 
        success: false, 
        error: "Email configuration missing. Please check EMAIL_USER and EMAIL_PASS environment variables." 
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("❌ Missing Supabase configuration");
      return res.status(500).json({ 
        success: false, 
        error: "Database configuration missing. Please check Supabase environment variables." 
      });
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Save OTP to database
    const otpData: CreateOtpData = {
      email,
      otp,
      is_used: false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    };

    await db.otp.create(otpData);

    // Send email
    const emailResult = await sendEmail(
      email,
      "Your 5-Digit OTP for LifeSkill Connect",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Your Verification Code</h2>
            <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 20px;">Your 5-digit verification code is:</p>
            <div style="background-color: #f0f8ff; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 25px 0; border: 2px dashed #4a90e2; border-radius: 8px; color: #4a90e2;">
              ${otp}
            </div>
            <p style="color: #888; font-size: 14px; text-align: center; margin: 20px 0;">⏰ This code will expire in 10 minutes.</p>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    );

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error);
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email",
        details: emailResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("❌ Error in sendOtp:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error"
    });
  }
};

// Verify OTP
export const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp }: { email: string; otp: string } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: "Email and OTP are required" });
    }

    const foundOtp = await db.otp.findFirst({
      where: {
        email,
        otp,
        is_used: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!foundOtp) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    }

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(foundOtp.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ success: false, error: "OTP has expired" });
    }

    // Mark as used
    await db.otp.update(foundOtp.id, { is_used: true });

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Create Account
export const createAccount = async (req: Request, res: Response): Promise<Response> => {
  try {
    await createAccountSchema.validate(req.body, { abortEarly: false });

    const {
      email,
      password,
      dateOfBirth,
      fullName,
      username,
      howdidyouhearaboutus,
      phoneNumber,
    } = req.body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase Auth via Admin API (auto-confirm)
    const { user: authUser, error: authError } = await db.auth.signUp(email, password, {
      full_name: fullName,
      username,
      phone_number: phoneNumber,
      howdidyouhearaboutus,
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      return res.status(400).json({
        success: false,
        error: "Failed to create account. Please try again.",
        details: authError.message,
      });
    }

    // Create user in database table
    const userData: CreateUserData = {
      email,
      password: hashedPassword,
      fullname: fullName,
      username,
      phone_number: phoneNumber,
      auth_provider: "EMAIL",
      role: "USER",
      is_active: true,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      howdidyouhearaboutus,
    };

    const user = await db.user.create(userData);

    // Generate OTP and send email immediately after signup
    try {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();
      await db.otp.create({
        email,
        otp,
        is_used: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      await sendEmail(
        email,
        "Your 5-Digit OTP for LifeSkill Connect",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Your Verification Code</h2>
              <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 20px;">Your 5-digit verification code is:</p>
              <div style="background-color: #f0f8ff; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 25px 0; border: 2px dashed #4a90e2; border-radius: 8px; color: #4a90e2;">
                ${otp}
              </div>
              <p style="color: #888; font-size: 14px; text-align: center; margin: 20px 0;">⏰ This code will expire in 10 minutes.</p>
              <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        `
      );
    } catch (otpError) {
      console.error("❌ Failed to send post-signup OTP:", otpError);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        phone_number: user.phone_number,
        auth_provider: user.auth_provider,
        role: user.role,
        is_active: user.is_active,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        howdidyouhearaboutus: user.howdidyouhearaboutus,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
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

// Login
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });
    const { email, password } = req.body;

    // Check if user exists in database
    const user = await db.user.findUnique({ email });
    if (!user) {
      return res.status(404).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Prevent password login for Google/Apple accounts
    if (user.auth_provider === "GOOGLE" || user.auth_provider === "APPLE") {
      return res.status(400).json({
        message: `This account was created using ${user.auth_provider}. Please log in with ${user.auth_provider} instead.`,
        success: false,
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Sign in with Supabase Auth
    const { user: authUser, error: authError } = await db.auth.signIn(email, password);
    if (authError) {
      console.error("Supabase Auth error:", authError);
      return res.status(400).json({
        message: "Authentication failed",
        success: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        phone_number: user.phone_number,
        auth_provider: user.auth_provider,
        role: user.role,
        is_active: user.is_active,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        howdidyouhearaboutus: user.howdidyouhearaboutus,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ errors: error.errors, success: false });
    }
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get Profile
export const getProfile = async (req: any, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        phone_number: user.phone_number,
        auth_provider: user.auth_provider,
        role: user.role,
        is_active: user.is_active,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        howdidyouhearaboutus: user.howdidyouhearaboutus,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Finish Signup
export const finishSignup = async (req: any, res: Response): Promise<Response> => {
  try {
    await finishSignupSchema.validate(req.body, { abortEarly: false });

    const userId = req.userId;
    const { username, phoneNumber, dateOfBirth, howdidyouhearaboutus } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update user profile
    const updatedUser = await db.user.update(userId, {
      username,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      howdidyouhearaboutus,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        username: updatedUser.username,
        phone_number: updatedUser.phone_number,
        auth_provider: updatedUser.auth_provider,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        date_of_birth: updatedUser.date_of_birth,
        profile_picture: updatedUser.profile_picture,
        howdidyouhearaboutus: updatedUser.howdidyouhearaboutus,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ errors: error.errors, success: false });
    }
    console.error("Error in finishSignup:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Fetch All Modules
export const fetchAllModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const modules = await db.module.findMany();

    return res.status(200).json({
      success: true,
      modules: modules.map(module => ({
        id: module.id,
        title: module.title,
        plan_type: module.plan_type,
        is_certification_on_completion: module.is_certification_on_completion,
        total_hours: module.total_hours,
        subtitle_available: module.subtitle_available,
        description: module.description,
        features: module.features,
        created_at: module.created_at,
        updated_at: module.updated_at,
        user_id: module.user_id,
      })),
    });
  } catch (error) {
    console.error("Error in fetchAllModules:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Add Modules to User
export const addModulesToUser = async (req: any, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { moduleIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!moduleIds || !Array.isArray(moduleIds)) {
      return res.status(400).json({
        success: false,
        error: "Module IDs are required",
      });
    }

    await db.module.assignToUser(moduleIds, userId);

    return res.status(200).json({
      success: true,
      message: "Modules assigned successfully",
    });
  } catch (error) {
    console.error("Error in addModulesToUser:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Save Module
export const saveModule = async (req: any, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const moduleData: CreateModuleData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const module = await db.module.create({
      ...moduleData,
      user_id: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Module saved successfully",
      module: {
        id: module.id,
        title: module.title,
        plan_type: module.plan_type,
        is_certification_on_completion: module.is_certification_on_completion,
        total_hours: module.total_hours,
        subtitle_available: module.subtitle_available,
        description: module.description,
        features: module.features,
        created_at: module.created_at,
        updated_at: module.updated_at,
        user_id: module.user_id,
      },
    });
  } catch (error) {
    console.error("Error in saveModule:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Verify App Token Sign In
export const verifyAppTokenSiginIn = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(id, process.env.JWT_SECRET as string) as any;
    const user = await db.user.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        phone_number: user.phone_number,
        auth_provider: user.auth_provider,
        role: user.role,
        is_active: user.is_active,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        howdidyouhearaboutus: user.howdidyouhearaboutus,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in verifyAppTokenSiginIn:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// Verify App Token Sign Up
export const verifyAppTokenSiginUp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(id, process.env.JWT_SECRET as string) as any;
    const user = await db.user.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        phone_number: user.phone_number,
        auth_provider: user.auth_provider,
        role: user.role,
        is_active: user.is_active,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        howdidyouhearaboutus: user.howdidyouhearaboutus,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in verifyAppTokenSiginUp:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// Test email endpoint
export const testEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const result = await sendEmail(
      email,
      "🧪 Test Email from LifeSkill Connect",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🧪 Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> LifeSkill Connect Backend</p>
        </div>
      `
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Test email sent successfully",
        details: result
      });
    } else {
      return res.status(500).json({
        success: false,
        error: "Failed to send test email",
        details: result.error
      });
    }
  } catch (error) {
    console.error("Error in testEmail:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error
    });
  }
};
import { Request, Response } from "express";
import { db } from "../services/supabase-database.service";
import bcrypt from "bcryptjs";
import {
  AddModuleToUserPayLoad,
  CreateAccountPayload,
  FinishSignUpPayload,
  GoogleUserProfile,
  ModulePayload,
  SendOtpPayload,
  ValidateEmailPayload,
} from "../types/auth.types";
import * as yup from "yup";
import { sendEmail } from "../utils/email.utils";
import {
  createAccountSchema,
  finishSignupSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "../validation/auth-schema";
import axios from "axios";
import jwt from "jsonwebtoken";

// Using Supabase DB service (db)

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const MOBILE_APP_SCHEME = "exp://192.168.1.67:8081/--/";
console.log("MOBILE_APP_SCHEME:", MOBILE_APP_SCHEME);
console.log("DEPLOYMENT TEST - This should show exp:// URLs");

// Step 1: Redirect user to Google OAuth consent screen
export const startGoogleAuth = (req: Request, res: Response) => {
  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error("Missing Google OAuth configuration");
    return res.status(500).json({
      success: false,
      error: "Google OAuth not properly configured"
    });
  }

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
  res.redirect(url);
};

// Step 2: Handle Google's callback with "code"
export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  console.log(code, "CODEEE");

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error("Missing Google OAuth configuration in callback");
    return res.redirect(
      `${MOBILE_APP_SCHEME}?success=false&error=oauth_config_missing`
    );
  }

  if (!code) {
    console.error("No authorization code provided");
    return res.redirect(
      `${MOBILE_APP_SCHEME}?success=false&error=no_code`
    );
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

    let isPresent = await db.user.findUnique({ email });

    if (!isPresent) {
      isPresent = await db.user.create({
        email,
        fullname: name,
        is_active: true,
        role: "USER",
        auth_provider: "GOOGLE",
        profile_picture: picture,
      });
      const token = jwt.sign(
        { userId: isPresent.id, email: isPresent.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );
      console.log("Generated token for new user:", { userId: isPresent.id, email: isPresent.email });
      return res.redirect(
        `${process.env.GOOGLE_REDIRECT_URI}/verify-2/${token}`
      );
    }

    const token = jwt.sign(
      { userId: isPresent.id, email: isPresent.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    console.log("Generated token for existing user:", { userId: isPresent.id, email: isPresent.email });

    return res.redirect(
      `${process.env.GOOGLE_REDIRECT_URI}/verify/${token}`
    );
  } catch (error: any) {
    console.error(
      "Error during Google OAuth:",
      error?.response?.data || error.message
    );
    return res.redirect(
      `${MOBILE_APP_SCHEME}?success=false&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

export const verifyAppTokenSiginIn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("TOKEN for sign-in:", id);
    console.log("Token length:", id?.length);
    if (!id) {
      return res.status(400).json({ error: "Id is Required", success: false });
    }
    res.setHeader("Content-Type", "text/html");
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
    .card{max-width:520px;padding:24px;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,.07);text-align:center}
    a{color:#2563eb;text-decoration:none}
    .muted{color:#6b7280;font-size:14px;margin-top:10px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Redirecting…</h1>
    <p>Please wait while we open the app.</p>
    <p id="hint" class="muted" style="display:none">
      If nothing happens, <a id="deeplink" href="${MOBILE_APP_SCHEME}?token=${encodeURIComponent(
        id
      )}">tap here to open lifeskillsconnect</a>.
    </p>
  </div>
</body>
  <script>
    (function () {
      var token = ${JSON.stringify(id)}; // already server-side sanitized
      var target = "${MOBILE_APP_SCHEME}?token=" + encodeURIComponent(token);

      // Try immediate redirect
      function go() {
        // replace() avoids adding this page to history
        window.location.replace(target);
      }

      // Try JS redirect ASAP
      go();

      // As a safety net, try again shortly (helps on some Android browsers)
      setTimeout(go, 2000);

      // After a short delay, reveal the manual link for users
      setTimeout(function () {
        var hint = document.getElementById("hint");
        if (hint) hint.style.display = "block";
      }, 1200);
    })();
  </script>
</html>`);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", success: false });
  }
};

export const verifyAppTokenSiginUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("TOKEN for sign-up:", id);
    console.log("Token length:", id?.length);
    if (!id) {
      return res.status(400).json({ error: "Id is Required", success: false });
    }
    res.setHeader("Content-Type", "text/html");
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
    .card{max-width:520px;padding:24px;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,.07);text-align:center}
    a{color:#2563eb;text-decoration:none}
    .muted{color:#6b7280;font-size:14px;margin-top:10px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Redirecting…</h1>
    <p>Please wait while we open the app.</p>
    <p id="hint" class="muted" style="display:none">
      If nothing happens, <a id="deeplink" href="${MOBILE_APP_SCHEME}?token=${encodeURIComponent(
        id
      )}">tap here to open lifeskillsconnect</a>.
    </p>
  </div>
</body>
  <script>
    (function () {
      var token = ${JSON.stringify(id)}; // already server-side sanitized
      var target = "${MOBILE_APP_SCHEME}?token=" + encodeURIComponent(token);

      // Try immediate redirect
      function go() {
        // replace() avoids adding this page to history
        window.location.replace(target);
      }

      // Try JS redirect ASAP
      go();

      // As a safety net, try again shortly (helps on some Android browsers)
      setTimeout(go, 2000);

      // After a short delay, reveal the manual link for users
      setTimeout(function () {
        var hint = document.getElementById("hint");
        if (hint) hint.style.display = "block";
      }, 1200);
    })();
  </script>
</html>`);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", success: false });
  }
};

// Finishing Account Creation with ThirdParty
export const finishSignup = async (req: any, res: Response) => {
  try {
    // ✅ Validate request body
    await finishSignupSchema.validate(req.body, { abortEarly: false });

    const { phoneNumber, username, dateOfBirth, howdidyouhearaboutus } =
      req.body as FinishSignUpPayload;

    // ✅ Get userId from decoded JWT (middleware attaches it to req.user)
    const userId = req.userId; // 👈 use what middleware actually sets
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "UserId is required",
      });
    }

    // ✅ Check if user exists
    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User not found with ID ${userId}`,
      });
    }

    // ✅ Update user data
    await db.user.update(user.id, {
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      username,
      howdidyouhearaboutus,
    });

    // ✅ Generate new token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Signup completed successfully",
      token,
    });
  } catch (error) {
    console.error("Error in finishSignup:", error);

    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
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
    const existingUser = await db.user.findUnique({ email });

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
      const existingUser = await db.user.findUnique({ email });
      if (!existingUser) {
        return res
          .status(404)
          .json({ success: false, error: "No user found with this email" });
      }
    }

    // Save OTP to DB
    const isPresent = await db.otp.findFirst({
      where: { email, otp: OTP, is_used: false },
      orderBy: { created_at: 'desc' },
    });

    if (!isPresent) {
      // If no existing OTP, create a new one
      await db.otp.create({ email, otp: OTP, is_used: false, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    } else {
      // If an existing OTP is found, update it
      await db.otp.update(isPresent.id, { otp: OTP, is_used: false });
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

    const foundOtp = await db.otp.findFirst({
      where: { email, otp, is_used: false },
      orderBy: { created_at: 'desc' },
    });

    if (!foundOtp) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    }

    // // OPTIONAL: check for expiration (e.g., OTP older than 10 mins)
    // const expirationTime = 10 * 60 * 1000; // 10 minutes
    // const createdAt = new Date(foundOtp.createdAt).getTime();
    // if (Date.now() - createdAt > expirationTime) {
    //   return res.status(410).json({ success: false, error: "OTP expired" });
    // }

    // Mark as used
    await db.otp.update(foundOtp.id, { is_used: true });

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
      username,
      howdidyouhearaboutus,
      phoneNumber,
    }: CreateAccountPayload = req.body;

    // Your account creation logic here
    // e.g., save to database, hash password, etc.

    const isPresent = await db.user.findUnique({ email });

    if (isPresent) {
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      email,
      password: hashedPassword,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      fullname: fullName,
      is_active: true,
      role: "USER",
      username,
      auth_provider: "EMAIL",
      howdidyouhearaboutus,
      phone_number: phoneNumber,
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
    const user = await db.user.findUnique({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Incorrect ID", success: false });
    }

    // ✅ Prevent password login for Google/Apple accounts
    if (user.auth_provider === "GOOGLE" || user.auth_provider === "APPLE") {
      return res.status(400).json({
        message: `This account was created using ${user.authProvider}. Please log in with ${user.authProvider} instead.`,
        success: false,
      });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid password", success: false });
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
      return res.status(400).json({ errors: error.errors,success : false });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error",success : false });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.userId; // 👈 use what middleware actually sets

    if (!userId) {
      return res
        .status(401)
        .json({ error: "User is not logged in", success: false });
    }

    const user = await db.user.findById(userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid User", success: false });
    }

    return res.status(200).json({
      data: user,
      success: true,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};


// export const updateDetails = async (req: Request, res: Response) => {
//   try {
//     // Validate request body
//     await updateUserSchema.validate(req.body, { abortEarly: false });

//     const { email, ...body } = req.body;

//     // Find user
//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!existingUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Block Google/Apple accounts if needed
//     if (
//       existingUser.authProvider &&
//       ["google", "apple"].includes(existingUser.authProvider)
//     ) {
//       return res.status(403).json({
//         message: "Cannot manually update Google/Apple linked accounts",
//       });
//     }

//     // Remove null/empty values
//     const updates: Record<string, any> = {};
//     for (const [key, value] of Object.entries(body)) {
//       if (value !== null && value !== undefined && value !== "") {
//         updates[key] = value;
//       }
//     }

//     // Only keep changed values
//     const finalUpdates: Record<string, any> = {};
//     for (const [key, value] of Object.entries(updates)) {
//       if ((existingUser as any)[key] !== value) {
//         finalUpdates[key] = value;
//       }
//     }

//     // If no changes, return user without updating
//     if (Object.keys(finalUpdates).length === 0) {
//       return res.status(200).json({ user: existingUser });
//     }

//     const updatedUser = await prisma.user.update({
//       where: { email },
//       data: finalUpdates,
//     });

//     res.status(200).json({
//       message: "Details updated successfully",
//       user: updatedUser,
//     });
//   } catch (error: any) {
//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         errors: error.errors,
//       });
//     }
//     console.error("Update details error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Validate request body
    await resetPasswordSchema.validate(req.body, { abortEarly: false });
    const { email, password } = req.body;

    // Find user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if account is Google/Apple
    if (user.auth_provider === "GOOGLE" || user.auth_provider === "APPLE") {
      return res.status(400).json({
        success: false,
        message: `Password reset is not available for ${user.authProvider} accounts`,
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.user.update({
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

// Fetch All Modules
export const fetchAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await db.module.findMany({});
    return res.status(200).json({
      success: true,
      modules,
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add Modules to User
export const addModulesToUser = async (req: Request, res: Response) => {
  try {
    const { email, moduleIds } = req.body as AddModuleToUserPayLoad;

    // Basic payload validation
    if (!email || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email and an array of module IDs are required",
      });
    }

    // 1. Find the user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Validate module IDs exist
    const existingModules = await db.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true },
    });

    const existingModuleIds = existingModules.map((m) => m.id);
    const invalidModuleIds = moduleIds.filter(
      (id) => !existingModuleIds.includes(id)
    );

    if (invalidModuleIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid module IDs: ${invalidModuleIds.join(", ")}`,
      });
    }

    // 3. Assign modules to user
    await db.module.updateMany({
      where: { id: { in: existingModuleIds } },
      data: { userId: user.id },
    });

    return res.status(200).json({
      success: true,
      message: "Modules successfully assigned to user",
    });
  } catch (error) {
    console.error("Error adding modules to user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const saveModule = async (req: Request, res: Response) => {
  try {
    const data = req.body as ModulePayload;

    // --- 1. Basic validation ---
    if (!data.title || !data.plan_type || !data.total_hours) {
      return res.status(400).json({
        success: false,
        message: "title, plan_type, and total_hours are required fields",
      });
    }

    if (!["free", "premium"].includes(data.plan_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan_type. Must be 'free' or 'premium'",
      });
    }

    if (!Array.isArray(data.features) || data.features.length === 0) {
      return res.status(400).json({
        success: false,
        message: "features must be a non-empty array",
      });
    }

    // --- 3. Save to database ---
    const module = await db.module.create({
      data: {
        title: data.title,
        plan_type: data.plan_type,
        isCertificationOnCompletion: data.isCertificationOnCompletion ?? false,
        total_hours: data.total_hours,
        subtitle_available: data.subtitle_available ?? false,
        description: data.description ?? null,
        features: data.features,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      module,
    });
  } catch (error) {
    console.error("Error saving module:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
