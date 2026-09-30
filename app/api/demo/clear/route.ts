import { createClient } from "@/lib/supabase/server";

// Removes every demo row from the caller's org.
//
// Deleting the flagged accounts is enough: contacts, deals, deal_contacts and
// activities all cascade from accounts, so there is no orphan sweep to get
// wrong. Real rows are never touched — they don't carry the flag.

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

  const { error } = await db
    .from("accounts").delete()
    .eq("organization_id", orgId).eq("is_demo", true);
  if (error) {
    console.error("[demo] clear failed:", error);
    return new Response("Could not clear the demo data.", { status: 500 });
  }

  // Belt and braces: a demo deal on a real account would not cascade.
  await db.from("deals").delete().eq("organization_id", orgId).eq("is_demo", true);

  await db.from("organizations").update({ demo_seeded_at: null }).eq("id", orgId);

  return Response.json({ ok: true });
}
