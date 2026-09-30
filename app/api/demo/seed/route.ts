import { createClient } from "@/lib/supabase/server";
import { DEMO_DEALS } from "@/lib/demo/fixtures";

// Seeds worked example data into the caller's own org, flagged is_demo.
//
// Written with the caller's client, not the service role: these are ordinary
// rows in their own org, so normal RLS should be able to create them. If it
// can't, that's a policy bug worth surfacing rather than bypassing.

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db
    .from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profile as { organization_id: string } | null)?.organization_id;
  if (!orgId) return new Response("No organization", { status: 400 });

  const { data: orgRaw } = await db
    .from("organizations").select("demo_seeded_at").eq("id", orgId).single();
  if ((orgRaw as { demo_seeded_at: string | null } | null)?.demo_seeded_at) {
    // Already seeded — seeding again would duplicate every example.
    return Response.json({ ok: true, alreadySeeded: true });
  }

  try {
    for (const d of DEMO_DEALS) {
      const { data: account, error: accErr } = await db
        .from("accounts")
        .insert({
          organization_id: orgId,
          name: d.account.name,
          domain: d.account.domain,
          industry: d.account.industry,
          size_band: d.account.size_band,
          is_demo: true,
        })
        .select("id")
        .single();
      if (accErr) throw accErr;
      const accountId = (account as { id: string }).id;

      const { data: contacts, error: conErr } = await db
        .from("contacts")
        .insert(
          d.contacts.map((c) => ({
            organization_id: orgId,
            account_id: accountId,
            name: c.name,
            title: c.title,
            is_demo: true,
          })),
        )
        .select("id, name");
      if (conErr) throw conErr;
      const contactRows = (contacts ?? []) as Array<{ id: string; name: string }>;
      const idFor = (name: string) => contactRows.find((c) => c.name === name)?.id ?? null;

      const eb = d.contacts.find((c) => c.role === "economic_buyer");

      const { data: deal, error: dealErr } = await db
        .from("deals")
        .insert({
          organization_id: orgId,
          account_id: accountId,
          owner_id: user.id,
          name: d.name,
          stage: d.stage,
          pain: d.pain,
          success_criteria: d.success_criteria,
          next_action: d.next_action,
          next_action_date: isoDaysFromNow(d.next_action_in_days),
          acv_value: d.acv_value,
          economic_buyer_met: d.economic_buyer_met,
          economic_buyer_contact_id: eb ? idFor(eb.name) : null,
          is_demo: true,
        })
        .select("id")
        .single();
      if (dealErr) throw dealErr;
      const dealId = (deal as { id: string }).id;

      await db.from("deal_contacts").insert(
        d.contacts.map((c) => ({ deal_id: dealId, contact_id: idFor(c.name), role: c.role })),
      );

      await db.from("activities").insert(
        d.activities.map((a) => ({
          organization_id: orgId,
          deal_id: dealId,
          created_by: user.id,
          type: a.type,
          title: a.title,
          notes: a.notes ?? null,
          agent_summary: a.agent_summary ?? null,
        })),
      );
    }

    await db
      .from("organizations")
      .update({ demo_seeded_at: new Date().toISOString() })
      .eq("id", orgId);

    return Response.json({ ok: true, deals: DEMO_DEALS.length });
  } catch (e) {
    console.error("[demo] seed failed:", e);
    const msg = (e as { message?: string })?.message ?? "";
    if (/is_demo|demo_seeded_at/.test(msg)) {
      return new Response(
        "Demo mode needs migration 020_usage_and_demo.sql to be run first.",
        { status: 503 },
      );
    }
    return new Response("Could not load the demo data.", { status: 500 });
  }
}
