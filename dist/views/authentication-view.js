"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.testEmail = exports.verifyAppTokenSiginUp = exports.verifyAppTokenSiginIn = exports.saveModule = exports.addModulesToUser = exports.fetchAllModules = exports.finishSignup = exports.getProfile = exports.login = exports.createAccount = exports.verifyOtp = exports.sendOtp = exports.validateEmail = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const yup = __importStar(require("yup"));
const email_utils_1 = require("../utils/email.utils");
const auth_schema_1 = require("../validation/auth-schema");
const supabase_database_service_1 = require("../services/supabase-database.service");
// Google OAuth Configuration (Legacy - will be replaced by Supabase)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const MOBILE_APP_SCHEME = process.env.MOBILE_APP_SCHEME || "lifeskillsconnect://";
// Validate Email
const validateEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: "Email is required" });
        }
        // Check if email already exists
        const existingUser = await supabase_database_service_1.db.user.findUnique({ email });
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
    }
    catch (error) {
        console.error("Error in validateEmail:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.validateEmail = validateEmail;
// Send OTP
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
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
        const otpData = {
            email,
            otp,
            is_used: false,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        };
        await supabase_database_service_1.db.otp.create(otpData);
        // Send email
        const emailResult = await (0, email_utils_1.sendEmail)(email, "Your 5-Digit OTP for LifeSkill Connect", `
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
      `);
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
    }
    catch (error) {
        console.error("❌ Error in sendOtp:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.sendOtp = sendOtp;
// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: "Email and OTP are required" });
        }
        const foundOtp = await supabase_database_service_1.db.otp.findFirst({
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
        await supabase_database_service_1.db.otp.update(foundOtp.id, { is_used: true });
        return res.status(200).json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error in verifyOtp:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.verifyOtp = verifyOtp;
// Create Account
const createAccount = async (req, res) => {
    try {
        await auth_schema_1.createAccountSchema.validate(req.body, { abortEarly: false });
        const { email, password, dateOfBirth, fullName, username, howdidyouhearaboutus, phoneNumber, } = req.body;
        // Check if user already exists
        const existingUser = await supabase_database_service_1.db.user.findUnique({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: "Email already exists. Please use a different email address.",
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user in Supabase Auth via Admin API (auto-confirm)
        const { user: authUser, error: authError } = await supabase_database_service_1.db.auth.signUp(email, password, {
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
        const userData = {
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
        const user = await supabase_database_service_1.db.user.create(userData);
        // Generate OTP and send email immediately after signup
        try {
            const otp = Math.floor(10000 + Math.random() * 90000).toString();
            await supabase_database_service_1.db.otp.create({
                email,
                otp,
                is_used: false,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            });
            await (0, email_utils_1.sendEmail)(email, "Your 5-Digit OTP for LifeSkill Connect", `
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
        `);
        }
        catch (otpError) {
            console.error("❌ Failed to send post-signup OTP:", otpError);
            // Log more details for debugging
            console.error("Email config check:", {
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPass: !!process.env.EMAIL_PASS,
                emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'missing'
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
    }
    catch (error) {
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
exports.createAccount = createAccount;
// Login
const login = async (req, res) => {
    try {
        await auth_schema_1.loginSchema.validate(req.body, { abortEarly: false });
        const { email, password } = req.body;
        // Check if user exists in database
        const user = await supabase_database_service_1.db.user.findUnique({ email });
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password || "");
        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false,
            });
        }
        // Sign in with Supabase Auth
        const { user: authUser, error: authError } = await supabase_database_service_1.db.auth.signIn(email, password);
        if (authError) {
            console.error("Supabase Auth error:", authError);
            return res.status(400).json({
                message: "Authentication failed",
                success: false,
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
    }
    catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ errors: error.errors, success: false });
        }
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
exports.login = login;
// Get Profile
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await supabase_database_service_1.db.user.findById(userId);
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
    }
    catch (error) {
        console.error("Error in getProfile:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.getProfile = getProfile;
// Finish Signup
const finishSignup = async (req, res) => {
    try {
        await auth_schema_1.finishSignupSchema.validate(req.body, { abortEarly: false });
        const userId = req.userId;
        const { username, phoneNumber, dateOfBirth, howdidyouhearaboutus } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await supabase_database_service_1.db.user.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        // Update user profile
        const updatedUser = await supabase_database_service_1.db.user.update(userId, {
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
    }
    catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ errors: error.errors, success: false });
        }
        console.error("Error in finishSignup:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.finishSignup = finishSignup;
// Fetch All Modules
const fetchAllModules = async (req, res) => {
    try {
        const modules = await supabase_database_service_1.db.module.findMany();
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
    }
    catch (error) {
        console.error("Error in fetchAllModules:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.fetchAllModules = fetchAllModules;
// Add Modules to User
const addModulesToUser = async (req, res) => {
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
        await supabase_database_service_1.db.module.assignToUser(moduleIds, userId);
        return res.status(200).json({
            success: true,
            message: "Modules assigned successfully",
        });
    }
    catch (error) {
        console.error("Error in addModulesToUser:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.addModulesToUser = addModulesToUser;
// Save Module
const saveModule = async (req, res) => {
    try {
        const userId = req.userId;
        const moduleData = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const module = await supabase_database_service_1.db.module.create({
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
    }
    catch (error) {
        console.error("Error in saveModule:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.saveModule = saveModule;
// Verify App Token Sign In
const verifyAppTokenSiginIn = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Token is required",
            });
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(id, process.env.JWT_SECRET);
        const user = await supabase_database_service_1.db.user.findById(decoded.userId);
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
    }
    catch (error) {
        console.error("Error in verifyAppTokenSiginIn:", error);
        return res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }
};
exports.verifyAppTokenSiginIn = verifyAppTokenSiginIn;
// Verify App Token Sign Up
const verifyAppTokenSiginUp = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Token is required",
            });
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(id, process.env.JWT_SECRET);
        const user = await supabase_database_service_1.db.user.findById(decoded.userId);
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
    }
    catch (error) {
        console.error("Error in verifyAppTokenSiginUp:", error);
        return res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }
};
exports.verifyAppTokenSiginUp = verifyAppTokenSiginUp;
// Test email endpoint
const testEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: "Email is required" });
        }
        const result = await (0, email_utils_1.sendEmail)(email, "🧪 Test Email from LifeSkill Connect", `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🧪 Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> LifeSkill Connect Backend</p>
        </div>
      `);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: "Test email sent successfully",
                details: result
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: "Failed to send test email",
                details: result.error
            });
        }
    }
    catch (error) {
        console.error("Error in testEmail:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error
        });
    }
};
exports.testEmail = testEmail;
// Reset Password
const resetPassword = async (req, res) => {
    try {
        await auth_schema_1.resetPasswordSchema.validate(req.body, { abortEarly: false });
        const { email } = req.body;
        // Check if user exists
        const user = await supabase_database_service_1.db.user.findUnique({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found with this email address.",
            });
        }
        // Use Supabase Auth to send reset password email
        const { error } = await supabase_database_service_1.db.auth.resetPassword(email);
        if (error) {
            console.error("Supabase reset password error:", error);
            return res.status(400).json({
                success: false,
                error: "Failed to send reset password email. Please try again.",
                details: error.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Reset password email sent successfully. Please check your email.",
        });
    }
    catch (error) {
        console.error("Error in resetPassword:", error);
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
exports.resetPassword = resetPassword;
