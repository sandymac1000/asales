"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 — request a 6-digit code by email.
  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Stash the invite code so /join can claim it once the session exists.
    if (inviteCode.trim()) {
      localStorage.setItem("salient_invite", inviteCode.trim());
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError("Something went wrong. Check the email address and try again.");
    } else {
      setStep("code");
    }
  }

  // Step 2 — verify the code and create the session.
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

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
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a sign-in code to <span className="font-medium text-foreground">{email}</span>. Enter it below.
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
