"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Check if using custom SMTP or Gmail
const isGmail = (_a = process.env.EMAIL_USER) === null || _a === void 0 ? void 0 : _a.endsWith('@gmail.com');
const transporter = nodemailer_1.default.createTransport({
    ...(isGmail ? {
        service: "gmail",
    } : {
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: false, // true for 465, false for other ports
    }),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (to, subject, html) => {
    try {
        console.log("📧 Attempting to send email:", {
            to,
            subject,
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPass: !!process.env.EMAIL_PASS
        });
        const info = await transporter.sendMail({
            from: `"Life Skill Connect" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Email sent successfully:", info.messageId);
        return { success: true };
    }
    catch (error) {
        console.error("❌ Error sending email:", error);
        return { success: false, error };
    }
};
exports.sendEmail = sendEmail;
