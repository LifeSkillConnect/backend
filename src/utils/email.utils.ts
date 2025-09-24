import nodemailer from "nodemailer";

// Check if using custom SMTP or Gmail
const isGmail = process.env.EMAIL_USER?.endsWith('@gmail.com');

const transporter = nodemailer.createTransport({
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

export const sendEmail = async (to: string, subject: string, html: string) => {
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
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
};
