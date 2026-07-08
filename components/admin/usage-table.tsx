"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { AdminOrgUsage } from "@/lib/supabase/types";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function UsageTable({ initialOrgs }: { initialOrgs: AdminOrgUsage[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (initialOrgs.length === 0) {
    return <p className="text-xs text-muted-foreground">No organisations yet. Provision one above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Organisation</th>
            <th className="px-3 py-2 font-medium text-right">Members</th>
            <th className="px-3 py-2 font-medium text-right">Deals</th>
            <th className="px-3 py-2 font-medium">Last active</th>
            <th className="px-3 py-2 font-medium">Provisioned</th>
            <th className="px-3 py-2 font-medium">Invite code</th>
          </tr>
        </thead>
        <tbody>
          {initialOrgs.map((o) => (
            <tr key={o.organization_id} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-foreground">{o.name}</td>
              <td className="px-3 py-2 text-right font-mono text-foreground">{o.member_count}</td>
              <td className="px-3 py-2 text-right font-mono text-foreground">{o.deal_count}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(o.last_sign_in_at)}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(o.created_at)}</td>
              <td className="px-3 py-2">
                {o.invite_code ? (
                  <button
                    onClick={() => copy(o.invite_code!)}
                    className="flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                  >
                    {copied === o.invite_code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {o.invite_code}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">none</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
