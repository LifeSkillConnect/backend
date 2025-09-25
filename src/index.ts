import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authenticationController from "./controllers/authentication-controller";
import modulesController from "./controllers/modules-controller";
import rewardsController from "./controllers/rewards-controller";
import subscriptionController from "./controllers/subscription-controller";
import dashboardController from "./controllers/dashboard-controller";
import morgan from "morgan";
import { validateGoogleOAuthConfig, logOAuthConfig } from "./utils/config.utils";
import { authenticate } from "./middleware/middleware";
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
  res.send("Hello from Express + Vercel + TypeScript! - build: otp-normalized-1");
});

// Health check route
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Test token generation endpoint
app.get("/test-token", (_req, res) => {
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign(
    { userId: "test-user-id", email: "test@example.com" },
    process.env.JWT_SECRET || "your-super-secret-jwt-key",
    { expiresIn: "1h" }
  );
  
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
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
      message: error.message
    });
  }
});

// Test protected endpoint (requires authentication)
app.get("/test-protected", authenticate, (req: any, res) => {
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
app.use("/api/v1/auth", authenticationController);
app.use("/api/v1/modules", modulesController);
app.use("/api/v1/rewards", rewardsController);
app.use("/api/v1/subscription", subscriptionController);
app.use("/api/v1/dashboard", dashboardController);

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
