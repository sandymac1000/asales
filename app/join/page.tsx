"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(async (raw: string) => {
    const invite = raw.trim();
    if (!invite) return;
    setStatus("working");
    setError(null);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("claim_invite", { invite_code: invite });
    if (error || !data) {
      setStatus("error");
      setError("That invite code wasn't recognised. Check it and try again.");
      return;
    }
    localStorage.removeItem("salient_invite");
    router.push("/pipeline");
    router.refresh();
  }, [router]);

  // Auto-claim if the code was stashed at login (same-browser magic-link flow).
  useEffect(() => {
    const stashed = localStorage.getItem("salient_invite");
    if (stashed) void Promise.resolve().then(() => claim(stashed));
  }, [claim]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Join your organisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the invite code your organisation was given to get access.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); claim(code); }}
          className="space-y-4"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
            autoFocus
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={status === "working"}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={status === "working" || !code.trim()}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {status === "working" ? "Joining…" : "Join"}
          </button>
          <p className="text-xs text-muted-foreground">
            Don&apos;t have a code? Ask whoever invited you — each organisation has its own.
          </p>
        </form>
      </div>
    </div>
  );
}
