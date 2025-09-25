import express, { Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import AppleStrategy, { Profile } from "passport-apple";
import jwt from "jsonwebtoken";
import { expressjwt as jwtMiddleware } from "express-jwt";

import {
  validateEmail,
  sendOtp,
  verifyOtp,
  getOtpForTesting,
  createAccount,
  login,
  resetPassword,
  testEmailConfig,
  fetchAllModules,
  addModulesToUser,
  saveModule,
  getProfile,
  verifyAppTokenSiginIn,
  verifyAppTokenSiginUp,
  finishSignup,
} from "../views/authentication-view";
import {
  startGoogleAuth,
  googleCallback,
  verifySupabaseToken,
  signOut,
  getCurrentUser,
} from "../views/supabase-auth-view";
import { authenticate } from "../middleware/middleware";
import { db } from "../services/supabase-database.service";

const router = express.Router();

// ---------------- Session Config ----------------
router.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // ✅ use env
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

router.use(passport.initialize());
router.use(passport.session());

// ---------------- Passport Config ----------------
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.user.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new AppleStrategy(
    {
      clientID: "com.lifeskillconnect.web",
      teamID: process.env.APPLE_TEAM_ID!, // Team ID
      keyID: process.env.APPLE_KEY_ID!, // Key ID
      //@ts-ignore
      privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n")!, // fixed
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://backend-azure-chi.vercel.app/api/v1/auth/apple/callback"
          : "https://17r1d02m-3000.uks1.devtunnels.ms/api/auth/apple/callback",
      scope: ["name", "email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      _idToken: string,
      profile: Profile,
      done: any
    ) => {
      try {
        const appleSub = profile.id;
        const email = profile.emails?.[0]?.value ?? null;
        const fullName = profile.name
          ? `${profile.name.firstName ?? ""} ${
              profile.name.lastName ?? ""
            }`.trim()
          : null;

        const safeEmail =
          email ||
          (appleSub ? `${appleSub}@privaterelay.appleid.com` : undefined);

        if (!safeEmail) {
          return done(new Error("No valid email found from Apple"));
        }

        let user = await db.user.findUnique({ email: safeEmail });

        if (!user) {
          user = await db.user.create({
            email: safeEmail,
            fullname: fullName || "Apple User",
            auth_provider: "APPLE",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, null);
      }
    }
  )
);

// ---------------- Apple Auth Routes ----------------
router.get(
  "/apple",
  //@ts-ignore
  passport.authenticate("apple", { scope: ["name", "email"], state: true })
);

router.all(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/api/auth/failure" }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
      return res.redirect("/api/auth/failure");
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, provider: "apple" },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const mobileAppScheme = process.env.MOBILE_APP_SCHEME || "lifeskillsconnect";
    const redirectUrl = `${mobileAppScheme}://account?token=${encodeURIComponent(
      token
    )}`;
    res.redirect(redirectUrl);
  }
);

router.get("/failure", (_req, res) => {
  res.status(401).json({ error: "Apple login failed" });
});

// ---------------- Email & OTP Routes ----------------
router.post("/validate-email", validateEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/get-otp/:email", getOtpForTesting); // TEMPORARY - for testing only

// ---------------- Account Routes ----------------
router.post("/create-account", createAccount);
router.post("/login", login);
router.post("/test-email-config", testEmailConfig);
router.put("/reset-password", resetPassword);
router.get("/profile", authenticate, getProfile);
router.post("/finish-signup", authenticate, finishSignup);

// ---------------- Google Auth Routes (Supabase) ----------------
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleCallback);
router.get("/google/callback/verify/:id", verifyAppTokenSiginIn);
router.get("/google/callback/verify-2/:id", verifyAppTokenSiginUp);

// ---------------- Supabase Auth Routes ----------------
router.post("/verify-token", verifySupabaseToken);
router.post("/signout", signOut);
router.get("/me", getCurrentUser);

// ---------------- Modules Routes ----------------
router.get("/get-modules", fetchAllModules);
router.post("/assign-modules", addModulesToUser);
router.post("/add-modules", saveModule);

export default router;
