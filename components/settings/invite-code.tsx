"use client";

import { useState, useEffect } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function InviteCode() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("org_invites")
      .select("code")
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { code: string } | null }) => {
        if (active) setCode(data?.code ?? null);
      });
    return () => { active = false; };
  }, []);

  function copy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Invite your team</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Share this code with colleagues. They enter it on the sign-in page (first time only)
        to join this organisation.
      </p>
      {code ? (
        <div className="flex items-center justify-between rounded border border-border bg-background px-3 py-2">
          <span className="font-mono text-sm text-foreground">{code}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No invite code configured for this organisation yet.</p>
      )}
    </div>
  );
}
