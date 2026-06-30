import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, STAGE_LABELS, isOverdue, formatDate } from "@/lib/format";
import { ContactList } from "@/components/account/contact-list";
import { AccountHeader } from "@/components/account/account-header";
import type { Stage, Contact } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: accountRaw }, { data: dealsRaw }, { data: contactsRaw }] = await Promise.all([
    db.from("accounts").select("*").eq("id", accountId).single(),
    db.from("deals").select("*, economic_buyer:contacts(*)").eq("account_id", accountId).order("created_at", { ascending: false }),
    db.from("contacts").select("*").eq("account_id", accountId).order("name"),
  ]);

  if (!accountRaw) notFound();

  const account = accountRaw as { id: string; organization_id: string; name: string; domain: string | null; industry: string | null; size_band: string | null; notes: string | null };
  const deals = (dealsRaw ?? []) as Array<{ id: string; name: string; stage: Stage; acv_value: number | null; currency: string; next_action: string | null; next_action_date: string | null; economic_buyer?: { name: string } | null }>;
  const contacts = (contactsRaw ?? []) as Contact[];

  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const closedDeals = deals.filter((d) => ["won", "lost"].includes(d.stage));

  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ChevronLeft className="h-3 w-3" />
        Accounts
      </Link>

      <AccountHeader account={account} />

      {/* Contacts */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          People ({contacts.length})
        </h2>
        <ContactList contacts={contacts} accountId={accountId} orgId={account.organization_id} />
      </section>

      {/* Active deals */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Active deals ({activeDeals.length})
        </h2>
        <DealList deals={activeDeals} />
      </section>

      {/* Closed deals */}
      {closedDeals.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Closed ({closedDeals.length})
          </h2>
          <DealList deals={closedDeals} muted />
        </section>
      )}
    </div>
  );
}

function DealList({
  deals, muted,
}: {
  deals: Array<{ id: string; name: string; stage: Stage; acv_value: number | null; currency: string; next_action: string | null; next_action_date: string | null; economic_buyer?: { name: string } | null }>
  muted?: boolean
}) {
  if (deals.length === 0) {
    return <p className="text-sm text-muted-foreground">None.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {deals.map((deal) => (
        <Link
          key={deal.id}
          href={`/pipeline/${deal.id}`}
          className="flex items-center justify-between px-4 py-3.5 hover:bg-muted transition-colors group"
        >
          <div className="min-w-0">
            <p className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground group-hover:text-accent transition-colors"}`}>
              {deal.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{STAGE_LABELS[deal.stage]}</span>
              {deal.next_action_date && (
                <span className={`text-xs font-mono ${isOverdue(deal.next_action_date) ? "text-health-red" : "text-muted-foreground"}`}>
                  · {formatDate(deal.next_action_date)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {deal.acv_value != null && (
              <span className="text-xs font-mono text-muted-foreground">
                {formatCurrency(deal.acv_value, deal.currency)}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ))}
    </div>
  );
}
