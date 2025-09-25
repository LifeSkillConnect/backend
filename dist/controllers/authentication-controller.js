"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_apple_1 = __importDefault(require("passport-apple"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authentication_view_1 = require("../views/authentication-view");
const supabase_auth_view_1 = require("../views/supabase-auth-view");
const middleware_1 = require("../middleware/middleware");
const supabase_database_service_1 = require("../services/supabase-database.service");
const router = express_1.default.Router();
// ---------------- Session Config ----------------
router.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "default_secret", // ✅ use env
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    },
}));
router.use(passport_1.default.initialize());
router.use(passport_1.default.session());
// ---------------- Passport Config ----------------
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await supabase_database_service_1.db.user.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
passport_1.default.use(new passport_apple_1.default({
    clientID: "com.lifeskillconnect.web",
    teamID: process.env.APPLE_TEAM_ID, // Team ID
    keyID: process.env.APPLE_KEY_ID, // Key ID
    //@ts-ignore
    privateKey: (_a = process.env.APPLE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"), // fixed
    callbackURL: process.env.NODE_ENV === "production"
        ? "https://backend-azure-chi.vercel.app/api/v1/auth/apple/callback"
        : "https://17r1d02m-3000.uks1.devtunnels.ms/api/auth/apple/callback",
    scope: ["name", "email"],
}, async (_accessToken, _refreshToken, _idToken, profile, done) => {
    var _a, _b, _c, _d, _e;
    try {
        const appleSub = profile.id;
        const email = (_c = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : null;
        const fullName = profile.name
            ? `${(_d = profile.name.firstName) !== null && _d !== void 0 ? _d : ""} ${(_e = profile.name.lastName) !== null && _e !== void 0 ? _e : ""}`.trim()
            : null;
        const safeEmail = email ||
            (appleSub ? `${appleSub}@privaterelay.appleid.com` : undefined);
        if (!safeEmail) {
            return done(new Error("No valid email found from Apple"));
        }
        let user = await supabase_database_service_1.db.user.findUnique({ email: safeEmail });
        if (!user) {
            user = await supabase_database_service_1.db.user.create({
                email: safeEmail,
                fullname: fullName || "Apple User",
                auth_provider: "APPLE",
            });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err, null);
    }
}));
// ---------------- Apple Auth Routes ----------------
router.get("/apple", 
//@ts-ignore
passport_1.default.authenticate("apple", { scope: ["name", "email"], state: true }));
router.all("/apple/callback", passport_1.default.authenticate("apple", { failureRedirect: "/api/auth/failure" }), (req, res) => {
    const user = req.user;
    if (!user) {
        return res.redirect("/api/auth/failure");
    }
    const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, provider: "apple" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const mobileAppScheme = process.env.MOBILE_APP_SCHEME || "lifeskillsconnect";
    const redirectUrl = `${mobileAppScheme}://account?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
});
router.get("/failure", (_req, res) => {
    res.status(401).json({ error: "Apple login failed" });
});
// ---------------- Email & OTP Routes ----------------
router.get("/version", (_req, res) => res.json({ version: "otp-normalized-1" }));
router.post("/validate-email", authentication_view_1.validateEmail);
router.post("/send-otp", authentication_view_1.sendOtp);
router.post("/verify-otp", authentication_view_1.verifyOtp);
router.get("/get-otp/:email", authentication_view_1.getOtpForTesting); // TEMPORARY - for testing only
// ---------------- Account Routes ----------------
router.post("/create-account", authentication_view_1.createAccount);
router.post("/login", authentication_view_1.login);
router.post("/test-email-config", authentication_view_1.testEmailConfig);
router.put("/reset-password", authentication_view_1.resetPassword);
router.get("/profile", middleware_1.authenticate, authentication_view_1.getProfile);
router.post("/finish-signup", middleware_1.authenticate, authentication_view_1.finishSignup);
// ---------------- Google Auth Routes (Supabase) ----------------
router.get("/google", supabase_auth_view_1.startGoogleAuth);
router.get("/google/callback", supabase_auth_view_1.googleCallback);
router.get("/google/callback/verify/:id", authentication_view_1.verifyAppTokenSiginIn);
router.get("/google/callback/verify-2/:id", authentication_view_1.verifyAppTokenSiginUp);
// ---------------- Supabase Auth Routes ----------------
router.post("/verify-token", supabase_auth_view_1.verifySupabaseToken);
router.post("/signout", supabase_auth_view_1.signOut);
router.get("/me", supabase_auth_view_1.getCurrentUser);
// ---------------- Modules Routes ----------------
router.get("/get-modules", authentication_view_1.fetchAllModules);
router.post("/assign-modules", authentication_view_1.addModulesToUser);
router.post("/add-modules", authentication_view_1.saveModule);
exports.default = router;
