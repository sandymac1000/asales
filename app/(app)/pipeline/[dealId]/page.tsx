import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { DealDetailClient } from "./deal-detail-client";
import type { DealFull, DealAction } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>
}) {
  const { dealId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: raw } = await db
    .from("deals")
    .select(`
      *,
      account:accounts(*),
      economic_buyer:contacts(*),
      owner:users(*),
      deal_contacts(*, contact:contacts(*)),
      activities(*, contact:contacts(*), user:users(*))
    `)
    .eq("id", dealId)
    .single();

  if (!raw) notFound();

  const deal = raw as unknown as DealFull;

  // Sort activities newest-first
  if (deal.activities) {
    deal.activities.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Fetch expansion deals linked to this deal
  const { data: expansionRaw } = await db
    .from("deals")
    .select("id, name")
    .eq("parent_deal_id", dealId);

  const expansionDeals = (expansionRaw ?? []) as { id: string; name: string }[];

  // Fetch open action tracks for this deal
  const { data: actionsRaw } = await db
    .from("deal_actions")
    .select("*")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const dealActions = (actionsRaw ?? []) as DealAction[];

  // Get org ID from user profile for War Room
  const { data: profileRaw } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileRaw as { organization_id: string } | null)?.organization_id ?? "";

  return (
    <DealDetailClient
      deal={deal}
      currentUserId={user.id}
      expansionDeals={expansionDeals}
      dealActions={dealActions}
      orgId={orgId}
    />
  );
}
