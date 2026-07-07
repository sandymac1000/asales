"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Stash the invite code so /join can claim it after the magic-link round-trip.
    if (inviteCode.trim()) {
      localStorage.setItem("salient_invite", inviteCode.trim());
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError("Something went wrong. Check the email address and try again.");
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Salient
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enterprise selling for technical founders.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-md border border-border bg-card p-6">
            <p className="text-sm font-medium text-foreground">
              Check your email
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link to continue.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="
                  w-full rounded-md border border-border bg-background px-3 py-2
                  text-sm text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring
                  disabled:opacity-50
                "
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite" className="text-sm font-medium text-foreground">
                Invite code{" "}
                <span className="font-normal text-muted-foreground">(first time only)</span>
              </label>
              <input
                id="invite"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste the code from your invite"
                className="
                  w-full rounded-md border border-border bg-background px-3 py-2
                  text-sm text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring
                  disabled:opacity-50
                "
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                New here? Enter the code your organisation was given. Already a member? Leave it blank.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="
                w-full rounded-md bg-primary px-4 py-2.5
                text-sm font-medium text-primary-foreground
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              {loading ? "Sending link…" : "Send sign-in link"}
            </button>

            <p className="text-xs text-muted-foreground">
              We&apos;ll email you a magic link. No password needed.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
