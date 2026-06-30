import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: accounts } = await db
    .from("accounts")
    .select(`*, deals(id, stage, acv_value)`)
    .order("name");

  const rows = (accounts ?? []) as Array<{
    id: string; name: string; domain: string | null; industry: string | null
    deals: Array<{ id: string; stage: string; acv_value: number | null }>
  }>;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {rows.length} {rows.length === 1 ? "company" : "companies"}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-foreground font-medium">No accounts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts are created automatically when you add a deal.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {rows.map((account) => {
            const active = account.deals.filter((d) => !["won", "lost"].includes(d.stage));
            const totalAcv = active.reduce((s, d) => s + (d.acv_value ?? 0), 0);

            return (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {account.name}
                  </p>
                  {account.domain && (
                    <p className="text-xs text-muted-foreground mt-0.5">{account.domain}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
                  <span>{active.length} active {active.length === 1 ? "deal" : "deals"}</span>
                  {totalAcv > 0 && <span>{formatCurrency(totalAcv)} ACV</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
