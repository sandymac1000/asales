import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getReadiness } from "@/lib/onboarding";
import { StartClient } from "./start-client";

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profile } = await db
    .from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profile as { organization_id: string } | null)?.organization_id;
  if (!orgId) redirect("/join");

  const { data: orgRaw } = await db
    .from("organizations")
    .select("name, product_context, market_context, demo_seeded_at")
    .eq("id", orgId)
    .single();

  const org = orgRaw as {
    name: string
    product_context: string | null
    market_context: string | null
    demo_seeded_at: string | null
  } | null;

  // Real deals only: a seeded demo must not read as "you've started".
  const [{ count: dealCount }, { count: segmentCount }] = await Promise.all([
    db.from("deals").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("is_demo", false),
    db.from("market_segments").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  // The key lives in org_secrets, which no client may read — service role only.
  const svc = createServiceClient();
  const { data: secret } = await svc
    .from("org_secrets").select("anthropic_key_ciphertext")
    .eq("organization_id", orgId).maybeSingle();

  const readiness = getReadiness({
    hasKey: Boolean((secret as { anthropic_key_ciphertext: string | null } | null)?.anthropic_key_ciphertext),
    productContext: org?.product_context,
    marketContext: org?.market_context,
    segmentCount: segmentCount ?? 0,
    dealCount: dealCount ?? 0,
  });

  return (
    <StartClient
      orgName={org?.name ?? "your organisation"}
      readiness={readiness}
      productContext={org?.product_context ?? null}
      marketContext={org?.market_context ?? null}
      inDemo={Boolean(org?.demo_seeded_at)}
    />
  );
}
