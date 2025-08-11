import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authenticationController from "./controllers/authentication-controller";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.use("/api/v1/auth", authenticationController); 

// 404 handler (after all valid routes)
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
