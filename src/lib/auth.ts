import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { createAuthMiddleware, APIError } from "better-auth/api"
import { Resend } from "resend"
import { db } from "@/lib/db"
import * as schema from "@/db/schema"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const EMAIL_FROM = process.env.EMAIL_FROM ?? "CostTracker <onboarding@resend.dev>"

// Deployment-safe signup gating. If neither is configured, signup stays open
// (backward-compatible) — set at least one for a personal deployment.
const INVITE_CODE = process.env.SIGNUP_INVITE_CODE?.trim() || null
const ALLOWED_EMAILS = (process.env.SIGNUP_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Runs before every auth request; gates the email sign-up endpoint behind an
 * invite code and/or an email allowlist. Other endpoints (sign-in, password
 * reset, change) pass straight through.
 */
const signupGate = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-up/email") return
  const body = (ctx.body ?? {}) as { email?: string; inviteCode?: string }

  if (INVITE_CODE && body.inviteCode?.trim() !== INVITE_CODE) {
    throw new APIError("BAD_REQUEST", {
      message: "A valid invite code is required to sign up.",
    })
  }
  if (
    ALLOWED_EMAILS.length > 0 &&
    !ALLOWED_EMAILS.includes((body.email ?? "").trim().toLowerCase())
  ) {
    throw new APIError("FORBIDDEN", {
      message: "This email address is not allowed to sign up.",
    })
  }
})

async function sendResetEmail(email: string, url: string) {
  if (!resend) {
    // No email provider configured yet — log the link so dev/reset still works.
    console.log(`[auth] Password reset link for ${email}: ${url}`)
    return
  }
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your CostTracker password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p style="color:#52525b;margin:0 0 20px">
          We received a request to reset your CostTracker password. This link
          expires in 1 hour. If you didn't request it, you can ignore this email.
        </p>
        <a href="${url}" style="display:inline-block;background:#724DE7;color:#fff;
          text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">
          Reset password
        </a>
        <p style="color:#a1a1aa;font-size:12px;margin:20px 0 0">${url}</p>
      </div>`,
  })
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendResetEmail(user.email, url)
    },
  },
  hooks: {
    before: signupGate,
  },
  plugins: [nextCookies()],
})

/** Whether the signup form should collect an invite code. */
export const signupRequiresInviteCode = INVITE_CODE !== null
