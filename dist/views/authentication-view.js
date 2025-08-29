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
exports.saveModule = exports.addModulesToUser = exports.fetchAllModules = exports.resetPassword = exports.getProfile = exports.login = exports.createAccount = exports.verifyOtp = exports.sendOtp = exports.validateEmail = exports.finishSignup = exports.verifyAppTokenSiginUp = exports.verifyAppTokenSiginIn = exports.googleCallback = exports.startGoogleAuth = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const yup = __importStar(require("yup"));
const email_utils_1 = require("../utils/email.utils");
const auth_schema_1 = require("../validation/auth-schema");
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.prisma = new client_1.PrismaClient();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ||
    // "https://backend-azure-chi.vercel.app/api/v1/auth/google/callback";
    "https://backend-azure-chi.vercel.app/api/v1/auth/google/callback";
// Step 1: Redirect user to Google OAuth consent screen
const startGoogleAuth = (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    res.redirect(url);
};
exports.startGoogleAuth = startGoogleAuth;
// Step 2: Handle Google's callback with "code"
const googleCallback = async (req, res) => {
    var _a;
    const code = req.query.code;
    console.log(code, "CODEEE");
    if (!code) {
        console.error("No authorization code provided");
        return res.redirect("lifeskillsconnect://authentication?success=false&error=no_code");
    }
    try {
        // Exchange authorization code for tokens
        const tokenResponse = await axios_1.default.post("https://oauth2.googleapis.com/token", {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        }, { headers: { "Content-Type": "application/json" } });
        const { access_token, id_token } = tokenResponse.data;
        // Retrieve user's profile
        const profileResponse = await axios_1.default.get("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const { email, family_name, given_name, id, name, picture, verified_email, } = profileResponse.data;
        // TODO: Authenticate or create the user in your DB
        // Example: await saveUser(profile);
        let isPresent = await exports.prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!isPresent) {
            isPresent = await exports.prisma.user.create({
                data: {
                    email,
                    fullname: name,
                    isActive: true,
                    role: "USER",
                    authProvider: "GOOGLE",
                    profilePicture: picture,
                },
            });
            const token = jsonwebtoken_1.default.sign({ userId: isPresent.id, email: isPresent.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return res.redirect(`https://backend-azure-chi.vercel.app/api/v1/auth/google/callback/verify-2/${token}?`);
        }
        const token = jsonwebtoken_1.default.sign({ userId: isPresent.id, email: isPresent.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.redirect(`https://backend-azure-chi.vercel.app/api/v1/auth/google/callback/verify/${token}?`);
    }
    catch (error) {
        console.error("Error during Google OAuth:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return res.redirect(`lifeskillsconnect://authentication?success=false&error=${encodeURIComponent(error.message)}`);
    }
};
exports.googleCallback = googleCallback;
const verifyAppTokenSiginIn = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("TOKEN" + id);
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
      If nothing happens, <a id="deeplink" href="lifeskillsconnect://authentication?token=${encodeURIComponent(id)}">tap here to open lifeskillsconnect</a>.
    </p>
  </div>
</body>
  <script>
    (function () {
      var token = ${JSON.stringify(id)}; // already server-side sanitized
      var target = "lifeskillsconnect://authentication?token=" + encodeURIComponent(token);

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
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ error: "Internal Server Error", success: false });
    }
};
exports.verifyAppTokenSiginIn = verifyAppTokenSiginIn;
const verifyAppTokenSiginUp = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("TOKEN" + id);
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
      If nothing happens, <a id="deeplink" href="lifeskillsconnect://google?token=${encodeURIComponent(id)}">tap here to open lifeskillsconnect</a>.
    </p>
  </div>
</body>
  <script>
    (function () {
      var token = ${JSON.stringify(id)}; // already server-side sanitized
      var target = "lifeskillsconnect://google?token=" + encodeURIComponent(token);

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
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ error: "Internal Server Error", success: false });
    }
};
exports.verifyAppTokenSiginUp = verifyAppTokenSiginUp;
// Finishing Account Creation with ThirdParty
const finishSignup = async (req, res) => {
    var _a;
    try {
        // ✅ Validate request body
        await auth_schema_1.finishSignupSchema.validate(req.body, { abortEarly: false });
        const { phoneNumber, username, dateOfBirth, howdidyouhearaboutus } = req.body;
        // ✅ Get userId from decoded JWT (middleware attaches it to req.user)
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "UserId is required",
            });
        }
        // ✅ Check if user exists
        const user = await exports.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: `User not found with ID ${userId}`,
            });
        }
        // ✅ Update user data
        await exports.prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber, dateOfBirth, username, howdidyouhearaboutus },
        });
        // ✅ Generate new token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({
            success: true,
            message: "Signup completed successfully",
            token,
        });
    }
    catch (error) {
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
exports.finishSignup = finishSignup;
// Validate Email
const validateEmail = async (req, res) => {
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
        const existingUser = await exports.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Error validating email:", error);
        return res.status(500).json({
            success: false,
            error: "An unexpected error occurred while validating the email",
        });
    }
};
exports.validateEmail = validateEmail;
//Send Otp
const sendOtp = async (req, res) => {
    try {
        const { email, check_exists } = req.body;
        if (!email) {
            return res
                .status(400)
                .json({ success: false, error: "Email is required" });
        }
        const OTP = Math.floor(10000 + Math.random() * 90000).toString();
        // If check_exists is true (e.g., forgot password), validate email exists
        if (check_exists == true) {
            const existingUser = await exports.prisma.user.findUnique({ where: { email } });
            if (!existingUser) {
                return res
                    .status(404)
                    .json({ success: false, error: "No user found with this email" });
            }
        }
        // Save OTP to DB
        const isPresent = await exports.prisma.otp.findFirst({
            where: {
                email,
                isUsed: false,
            },
        });
        if (!isPresent) {
            // If no existing OTP, create a new one
            await exports.prisma.otp.create({
                data: {
                    email,
                    otp: OTP,
                    isUsed: false,
                },
            });
        }
        else {
            // If an existing OTP is found, update it
            await exports.prisma.otp.update({
                where: { id: isPresent.id },
                data: { otp: OTP, isUsed: false },
            });
        }
        // Send email
        await (0, email_utils_1.sendEmail)(email, "Your OTP Code", `<p>Your OTP code is: <strong>${OTP}</strong></p>`);
        return res
            .status(200)
            .json({ success: true, message: "OTP sent successfully" });
    }
    catch (error) {
        console.error("Error in sendOtp:", error);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};
exports.sendOtp = sendOtp;
// Verify Otp
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res
                .status(400)
                .json({ success: false, error: "Email and OTP are required" });
        }
        const foundOtp = await exports.prisma.otp.findFirst({
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
        // // OPTIONAL: check for expiration (e.g., OTP older than 10 mins)
        // const expirationTime = 10 * 60 * 1000; // 10 minutes
        // const createdAt = new Date(foundOtp.createdAt).getTime();
        // if (Date.now() - createdAt > expirationTime) {
        //   return res.status(410).json({ success: false, error: "OTP expired" });
        // }
        // Mark as used
        await exports.prisma.otp.update({
            where: { id: foundOtp.id },
            data: { isUsed: true },
        });
        return res
            .status(200)
            .json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error in verifyOtp : ", error);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};
exports.verifyOtp = verifyOtp;
//Create Account
const createAccount = async (req, res) => {
    try {
        await auth_schema_1.createAccountSchema.validate(req.body, { abortEarly: false });
        const { email, password, dateOfBirth, fullName, username, howdidyouhearaboutus, phoneNumber, } = req.body;
        // Your account creation logic here
        // e.g., save to database, hash password, etc.
        const isPresent = await exports.prisma.user.findUnique({
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await exports.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                dateOfBirth: new Date(dateOfBirth),
                fullname: fullName,
                isActive: true,
                role: "USER",
                username: username,
                authProvider: "EMAIL",
                howdidyouhearaboutus,
                phoneNumber,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({
            success: true,
            token: token,
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
// Login or Sign In
const login = async (req, res) => {
    try {
        // ✅ Validate request body
        await auth_schema_1.loginSchema.validate(req.body, { abortEarly: false });
        const { email, password } = req.body;
        // ✅ Check if user exists
        const user = await exports.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ message: "Incorrect ID", success: false });
        }
        // ✅ Prevent password login for Google/Apple accounts
        if (user.authProvider === "GOOGLE" || user.authProvider === "APPLE") {
            return res.status(400).json({
                message: `This account was created using ${user.authProvider}. Please log in with ${user.authProvider} instead.`,
                success: false,
            });
        }
        // ✅ Compare passwords
        const isMatch = await bcryptjs_1.default.compare(password, user.password || "");
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "Invalid password", success: false });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({
            success: true,
            token: token,
        });
    }
    catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ errors: error.errors, success: false });
        }
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error", success: false });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId || userId.trim() === "") {
            return res
                .status(401)
                .json({ error: "User is not logged in", success: false });
        }
        const user = await exports.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid User", success: false });
        }
        return res.status(200).json({
            data: user,
            success: true,
        });
    }
    catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Internal server error", success: false });
    }
};
exports.getProfile = getProfile;
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
const resetPassword = async (req, res) => {
    try {
        // Validate request body
        await auth_schema_1.resetPasswordSchema.validate(req.body, { abortEarly: false });
        const { email, password } = req.body;
        // Find user
        const user = await exports.prisma.user.findUnique({ where: { email } });
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await exports.prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        return res.json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (error) {
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
exports.resetPassword = resetPassword;
// Fetch All Modules
const fetchAllModules = async (req, res) => {
    try {
        const modules = await exports.prisma.module.findMany({});
        return res.status(200).json({
            success: true,
            modules,
        });
    }
    catch (error) {
        console.error("Error fetching modules:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.fetchAllModules = fetchAllModules;
// Add Modules to User
const addModulesToUser = async (req, res) => {
    try {
        const { email, moduleIds } = req.body;
        // Basic payload validation
        if (!email || !Array.isArray(moduleIds) || moduleIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Email and an array of module IDs are required",
            });
        }
        // 1. Find the user
        const user = await exports.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // 2. Validate module IDs exist
        const existingModules = await exports.prisma.module.findMany({
            where: { id: { in: moduleIds } },
            select: { id: true },
        });
        const existingModuleIds = existingModules.map((m) => m.id);
        const invalidModuleIds = moduleIds.filter((id) => !existingModuleIds.includes(id));
        if (invalidModuleIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid module IDs: ${invalidModuleIds.join(", ")}`,
            });
        }
        // 3. Assign modules to user
        await exports.prisma.module.updateMany({
            where: { id: { in: existingModuleIds } },
            data: { userId: user.id },
        });
        return res.status(200).json({
            success: true,
            message: "Modules successfully assigned to user",
        });
    }
    catch (error) {
        console.error("Error adding modules to user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.addModulesToUser = addModulesToUser;
const saveModule = async (req, res) => {
    var _a, _b, _c;
    try {
        const data = req.body;
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
        const module = await exports.prisma.module.create({
            data: {
                title: data.title,
                plan_type: data.plan_type,
                isCertificationOnCompletion: (_a = data.isCertificationOnCompletion) !== null && _a !== void 0 ? _a : false,
                total_hours: data.total_hours,
                subtitle_available: (_b = data.subtitle_available) !== null && _b !== void 0 ? _b : false,
                description: (_c = data.description) !== null && _c !== void 0 ? _c : null,
                features: data.features,
            },
        });
        return res.status(201).json({
            success: true,
            message: "Module created successfully",
            module,
        });
    }
    catch (error) {
        console.error("Error saving module:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.saveModule = saveModule;
