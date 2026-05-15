import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration
console.log("[Email System] Attempting to connect with user:", process.env.SMTP_USER);
transporter.verify(function (error, success) {
  if (error) {
    console.error("[Email System] SMTP Connection Error Detail:", error.message);
    if (error.message.includes("535")) {
      console.warn("[Email System] TIP: This 535 error means Google rejected your SMTP_USER or SMTP_PASS. Double check your App Password.");
    }
  } else {
    console.log("[Email System] SMTP Server is ready to deliver messages");
  }
});

const FROM = process.env.EMAIL_FROM || "MedOneX <noreply@medonex.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medonex.app";
const APP_NAME = "MedOneX";

// ─── Shared HTML template wrapper ────────────────────────────────────────────
function wrapTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#05070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:20px;">
    <!-- Logo Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:14px 20px;">
        <span style="color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;">MED<span style="color:#a5b4fc;">ONE</span>X</span>
      </div>
    </div>
    <!-- Card -->
    <div style="background:#0f0e1a;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;color:#fff;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:rgba(255,255,255,0.2);font-size:11px;letter-spacing:1px;text-transform:uppercase;">
      &copy; ${new Date().getFullYear()} ${APP_NAME} · Medical Excellence Platform
    </div>
  </div>
</body>
</html>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────
function ctaButton(text: string, href: string) {
  return `<a href="${href}" style="display:block;text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:16px 32px;border-radius:14px;text-decoration:none;margin:28px 0;box-shadow:0 8px 32px rgba(79,70,229,0.35);">${text}</a>`;
}

// ─── 1. Email Confirmation ────────────────────────────────────────────────────
export async function sendVerificationEmail(to: string, confirmUrl: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Verify your ${APP_NAME} account`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px;color:#fff;">Verify Your Email</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0 0 24px;line-height:1.6;">
        Welcome to ${APP_NAME}! Click the button below to confirm your email address and activate your medical student account.
      </p>
      ${ctaButton("Confirm Email Address", confirmUrl)}
      <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:16px;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `),
  });
}

// ─── 2. Password Reset ────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px;color:#fff;">Reset Password</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0 0 24px;line-height:1.6;">
        We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
      </p>
      ${ctaButton("Reset My Password", resetUrl)}
      <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:16px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    `),
  });
}

// ─── 3. Magic Link / OTP ──────────────────────────────────────────────────────
export async function sendMagicLinkEmail(to: string, magicUrl: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Your ${APP_NAME} login link`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px;color:#fff;">Magic Login Link</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0 0 24px;line-height:1.6;">
        Click the button below to sign in to your ${APP_NAME} account. This link is valid for 15 minutes and can only be used once.
      </p>
      ${ctaButton("Sign In to MedOneX", magicUrl)}
      <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:16px;">
        If you didn't request this, please ignore this email.
      </p>
    `),
  });
}

// ─── 4. Welcome Email (after confirmation) ────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Welcome to ${APP_NAME}, ${name}!`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px;color:#fff;">Welcome, Dr. ${name} 🎓</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0 0 24px;line-height:1.6;">
        Your account is now active. Start exploring your personalized medical curriculum, practice questions, and study tools.
      </p>
      ${ctaButton("Go to Dashboard", `${APP_URL}/dashboard-app`)}
    `),
  });
}
