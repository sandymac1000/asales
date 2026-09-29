"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Turn a GoTrue send failure into something the person reading it can act on.
 *
 * A single generic message here is actively harmful: a rate limit, a broken
 * mail service and an address with no account all looked identical, and the
 * advice ("check the email address") pushed the user to submit again — which
 * extends a rate limit rather than clearing it.
 */
function describeSendError(message: string, status?: number): string {
  const m = message.toLowerCase();

  if (status === 429 || m.includes("rate limit") || m.includes("only request this after")) {
    return `Too many requests — ${message} Wait it out rather than pressing again; each attempt restarts the clock.`;
  }
  // GoTrue's wording when shouldCreateUser is false and no account exists.
  if (m.includes("signups not allowed") || m.includes("user not found")) {
    return "No account for that address. If this is your first time, add your invite code above as well.";
  }
  if (status === 500 || m.includes("error sending") || m.includes("smtp")) {
    return "We couldn't send the email — the mail service rejected it. That's a fault at our end, not your address. Let the operator know.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That doesn't look like a valid email address.";
  }
  return `Couldn't send the code: ${message}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  // Whether we sent the code on this visit, so the copy below doesn't claim
  // to have just emailed someone who arrived holding a code already.
  const [justSent, setJustSent] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 — request a numeric code by email. The code's length is whatever
  // Supabase's Email OTP Length setting says; the input below accepts 6–8.
  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const invite = inviteCode.trim();
    // Stash the invite code so /join can claim it once the session exists.
    if (invite) {
      localStorage.setItem("salient_invite", invite);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Only mint a new account when an invite code was actually supplied.
      // With this always true, a returning user who mistypes their address
      // silently creates a second, org-less account and posts a confirmation
      // code to whoever owns the typo — the "limbo accounts" the operator
      // console then has to clean up.
      options: { shouldCreateUser: Boolean(invite) },
    });

    setLoading(false);
    if (error) {
      setError(describeSendError(error.message, error.status));
    } else {
      setJustSent(true);
      setStep("code");
    }
  }

  // Step 2 — verify the code and create the session.
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // Existing (confirmed) users verify as type "email"; a brand-new user's
    // first-ever code is a signup confirmation, which verifies as type "signup".
    // Try email first, then fall back to signup.
    let { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      const retry = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "signup" });
      error = retry.error;
    }

    setLoading(false);
    if (error) {
      setError("That code didn't work. It may have expired — request a new one.");
    } else {
      // Session established. Proxy routes org-less users to /join to claim their invite.
      router.push("/pipeline");
      router.refresh();
    }
  }

  const INPUT = `w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salient</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enterprise selling for technical founders.</p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" className={INPUT} disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite" className="text-sm font-medium text-foreground">
                Invite code <span className="font-normal text-muted-foreground">(first time only)</span>
              </label>
              <input
                id="invite" type="text" value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste the code from your invite" className={INPUT} disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                New here? Enter the code your organisation was given. Already a member? Leave it blank.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit" disabled={loading || !email}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Sending code…" : "Email me a sign-in code"}
            </button>

            <p className="text-xs text-muted-foreground">
              We&apos;ll email you a sign-in code. No password, and no link to click.
            </p>

            {/* Codes outlive the page that requested them: a code can arrive
                after the tab was closed, or be requested from another device.
                Without this, the only route to the entry box is sending
                another code — which invalidates the one already in hand and
                walks into the cooldown. */}
            <button
              type="button"
              disabled={!email || loading}
              onClick={() => { setError(null); setJustSent(false); setStep("code"); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-40 disabled:no-underline"
            >
              I already have a code
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                {justSent ? "Check your email" : "Enter your code"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {justSent ? "We sent a sign-in code to " : "Using the most recent code sent to "}
                <span className="font-medium text-foreground">{email}</span>. Enter it below.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm font-medium text-foreground">Sign-in code</label>
              <input
                id="code" type="text" inputMode="numeric" autoComplete="one-time-code"
                required autoFocus maxLength={8}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter the code from your email"
                className={`${INPUT} text-center text-lg tracking-[0.25em] font-mono`}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit" disabled={loading || code.trim().length < 6}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Signing in…" : "Verify & sign in"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(null); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
