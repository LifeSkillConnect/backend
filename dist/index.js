"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authentication_controller_1 = __importDefault(require("./controllers/authentication-controller"));
const morgan_1 = __importDefault(require("morgan"));
const config_utils_1 = require("./utils/config.utils");
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
    res.send("Hello from Express + Vercel + TypeScript! - Updated for OAuth fix");
});
// Health check route
app.get("/health", (_req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});
// Routes
app.use("/api/v1/auth", authentication_controller_1.default);
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
