import { createHash, randomInt } from "crypto";
import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";
import { ensureSchema, getPool } from "./postgres";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSecret(value: string) {
  return String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, "");
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${normalizeEmail(email)}:${code}`).digest("hex");
}

function generateCode() {
  return String(randomInt(100000, 999999));
}

function getEmailCredentials() {
  const user = normalizeEmail(process.env.GMAIL_USER || process.env.SMTP_USER || "");
  const pass = normalizeSecret(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "");
  return { user, pass };
}

function getMailer(): Transporter | null {
  const { user, pass } = getEmailCredentials();
  if (!user || !pass) return null;

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const usingDefaultGmail = host === "smtp.gmail.com" && !process.env.SMTP_HOST;

  if (usingDefaultGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure,
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });
}

function mailNotConfiguredMessage() {
  return "Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in Railway, then redeploy.";
}

export function isEmailConfigured() {
  const { user, pass } = getEmailCredentials();
  return Boolean(user && pass);
}

function classifySmtpError(error: any) {
  const message = String(error?.message || "");
  const response = String(error?.response || "");
  const combined = `${message} ${response}`.toLowerCase();

  if (/invalid login|authentication failed|username and password not accepted|535|534-5\.7\.9|eauth/i.test(combined)) {
    return "Gmail rejected the login. Use a Google App Password (not your normal password) and set GMAIL_USER + GMAIL_APP_PASSWORD in Railway.";
  }
  if (/daily user sending quota|550-5\.4\.5|too many emails/i.test(combined)) {
    return "Gmail daily sending limit reached. Try again tomorrow or use a different sender account.";
  }
  if (/timeout|timed out|etimedout|econnrefused|enotfound|connect/i.test(combined)) {
    return "Could not connect to Gmail SMTP from the server. Check Railway variables and try SMTP_PORT=465 with SMTP_SECURE=true.";
  }
  return "Could not send verification email. Confirm GMAIL_USER and GMAIL_APP_PASSWORD in Railway, then redeploy.";
}

export async function verifySmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  const mailer = getMailer();
  if (!mailer) {
    return { ok: false, error: "Gmail credentials are missing." };
  }

  try {
    await mailer.verify();
    return { ok: true };
  } catch (error: any) {
    console.error("SMTP verification failed:", error);
    return { ok: false, error: classifySmtpError(error) };
  }
}

async function ensureVerificationTable() {
  await ensureSchema();
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS auth_signup_verifications (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function storeVerificationCode(email: string, code: string) {
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await getPool().query(
    `INSERT INTO auth_signup_verifications (email, code_hash, expires_at, attempts, last_sent_at)
     VALUES ($1, $2, $3, 0, now())
     ON CONFLICT (email) DO UPDATE SET
       code_hash = EXCLUDED.code_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0,
       last_sent_at = now()`,
    [email, hashCode(email, code), expiresAt]
  );
}

export async function sendSignupVerificationCode(
  emailInput: string
): Promise<{ ok: boolean; error?: string; status?: number; pendingVerification?: boolean; retryAfterSeconds?: number }> {
  await ensureVerificationTable();
  const email = normalizeEmail(emailInput);
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address.", status: 400 };
  }

  const existing = await getPool().query("SELECT id FROM auth_users WHERE lower(email) = $1 LIMIT 1", [email]);
  if (existing.rows[0]) {
    return { ok: false, error: "An account with this email already exists. Please sign in.", status: 409 };
  }

  const prior = await getPool().query(
    "SELECT last_sent_at, expires_at FROM auth_signup_verifications WHERE email = $1 LIMIT 1",
    [email]
  );
  const priorRow = prior.rows[0];
  const lastSent = priorRow?.last_sent_at ? new Date(priorRow.last_sent_at).getTime() : 0;
  const codeStillValid = priorRow?.expires_at
    ? new Date(priorRow.expires_at).getTime() > Date.now()
    : false;

  if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
    if (codeStillValid) {
      return {
        ok: false,
        error: `A verification code was already sent. Check your inbox (and spam). You can resend in ${waitSec}s.`,
        status: 429,
        pendingVerification: true,
        retryAfterSeconds: waitSec,
      };
    }
    return { ok: false, error: `Please wait ${waitSec}s before requesting another code.`, status: 429, retryAfterSeconds: waitSec };
  }

  const mailer = getMailer();
  const fromName = process.env.GMAIL_FROM_NAME || "Fly AI Pathfinder";
  const fromAddress = getEmailCredentials().user;

  if (!mailer || !fromAddress) {
    console.error("Verification email skipped: Gmail SMTP is not configured.");
    return { ok: false, error: mailNotConfiguredMessage(), status: 503 };
  }

  const code = generateCode();

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: "Your Fly AI Pathfinder verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af;margin-bottom:8px">Verify your email</h2>
          <p style="color:#475569;margin-top:0">Use this code to finish creating your Fly AI Pathfinder account:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;padding:16px 0">${code}</div>
          <p style="color:#64748b;font-size:14px">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error: any) {
    console.error("Failed to send verification email:", error);
    return { ok: false, error: classifySmtpError(error), status: 503 };
  }

  await storeVerificationCode(email, code);
  return { ok: true };
}

export async function verifySignupCode(
  emailInput: string,
  codeInput: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  await ensureVerificationTable();
  const email = normalizeEmail(emailInput);
  const code = String(codeInput || "").trim();
  if (!email || !code) {
    return { ok: false, error: "Email and verification code are required.", status: 400 };
  }

  const row = await getPool().query(
    "SELECT code_hash, expires_at, attempts FROM auth_signup_verifications WHERE email = $1 LIMIT 1",
    [email]
  );
  const record = row.rows[0];
  if (!record) {
    return { ok: false, error: "No verification code found. Request a new code.", status: 400 };
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await getPool().query("DELETE FROM auth_signup_verifications WHERE email = $1", [email]);
    return { ok: false, error: "Verification code expired. Request a new code.", status: 400 };
  }

  if (Number(record.attempts) >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: "Too many failed attempts. Request a new code.", status: 429 };
  }

  if (hashCode(email, code) !== record.code_hash) {
    await getPool().query(
      "UPDATE auth_signup_verifications SET attempts = attempts + 1 WHERE email = $1",
      [email]
    );
    return { ok: false, error: "Invalid verification code.", status: 400 };
  }

  return { ok: true };
}

export async function clearSignupVerification(emailInput: string) {
  await ensureVerificationTable();
  const email = normalizeEmail(emailInput);
  if (!email) return;
  await getPool().query("DELETE FROM auth_signup_verifications WHERE email = $1", [email]);
}
