import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authenticationController from "./controllers/authentication-controller";
import morgan from "morgan";
import { validateGoogleOAuthConfig, logOAuthConfig } from "./utils/config.utils";
dotenv.config();

const app = express();

// Validate configuration on startup
logOAuthConfig();
if (!validateGoogleOAuthConfig()) {
  console.warn('⚠️  Google OAuth configuration is incomplete. Some features may not work properly.');
}

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("Hello from Express + Vercel + TypeScript! - Updated for OAuth fix");
});

// Health check route
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Routes
app.use("/api/v1/auth", authenticationController);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

// app.listen(3000, () => {
//   console.log("Server has started on PORT" + 3000);
// });

export default app; // ✅ export app for Vercel
