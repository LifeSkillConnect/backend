"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});
const sendEmail = async (to, subject, html) => {
    try {
        console.log("📧 Attempting to send email:", {
            to,
            subject,
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPass: !!process.env.EMAIL_PASS,
            emailUser: process.env.EMAIL_USER
        });
        // Verify transporter connection
        await transporter.verify();
        console.log("✅ SMTP connection verified");
        const info = await transporter.sendMail({
            from: `"Life Skill Connect" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Email sent successfully:", {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error("❌ Error sending email:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        return { success: false, error: error.message };
    }
};
exports.sendEmail = sendEmail;
