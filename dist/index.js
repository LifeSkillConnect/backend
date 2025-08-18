"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authentication_controller_1 = __importDefault(require("./controllers/authentication-controller"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root route
app.get("/", (req, res) => {
    res.send("Hello from Express + Vercel + TypeScript!");
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
exports.default = app; // ✅ export app for Vercel
