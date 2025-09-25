"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authentication_controller_1 = __importDefault(require("./controllers/authentication-controller"));
const modules_controller_1 = __importDefault(require("./controllers/modules-controller"));
const rewards_controller_1 = __importDefault(require("./controllers/rewards-controller"));
const subscription_controller_1 = __importDefault(require("./controllers/subscription-controller"));
const dashboard_controller_1 = __importDefault(require("./controllers/dashboard-controller"));
const morgan_1 = __importDefault(require("morgan"));
const config_utils_1 = require("./utils/config.utils");
const middleware_1 = require("./middleware/middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Validate configuration on startup
(0, config_utils_1.logOAuthConfig)();
if (!(0, config_utils_1.validateGoogleOAuthConfig)()) {
    console.warn('⚠️  Google OAuth configuration is incomplete. Some features may not work properly.');
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("tiny"));
app.use(express_1.default.urlencoded({ extended: true }));
// Root route
app.get("/", (req, res) => {
    res.send("Hello from Express + Vercel + TypeScript! - build: otp-normalized-1");
});
// Health check route
app.get("/health", (_req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});
// Test token generation endpoint
app.get("/test-token", (_req, res) => {
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign({ userId: "test-user-id", email: "test@example.com" }, process.env.JWT_SECRET || "your-super-secret-jwt-key", { expiresIn: "1h" });
    res.json({
        success: true,
        token: testToken,
        decoded: jwt.decode(testToken),
        message: "Test token generated successfully"
    });
});
// Test token verification endpoint
app.get("/test-verify/:token", (req, res) => {
    const jwt = require('jsonwebtoken');
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-jwt-key");
        res.json({
            success: true,
            decoded,
            message: "Token verified successfully"
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: "Invalid token",
            message: error.message
        });
    }
});
// Test protected endpoint (requires authentication)
app.get("/test-protected", middleware_1.authenticate, (req, res) => {
    res.json({
        success: true,
        message: "Protected endpoint accessed successfully",
        user: {
            userId: req.userId,
            email: req.userEmail
        }
    });
});
// Routes
app.use("/api/v1/auth", authentication_controller_1.default);
app.use("/api/v1/modules", modules_controller_1.default);
app.use("/api/v1/rewards", rewards_controller_1.default);
app.use("/api/v1/subscription", subscription_controller_1.default);
app.use("/api/v1/dashboard", dashboard_controller_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
});
// app.listen(3000, () => {
//   console.log("Server has started on PORT" + 3000);
// });
exports.default = app; // ✅ export app for Vercel
