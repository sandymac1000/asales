import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { encryptSecret, last4 } from "@/lib/crypto";

// Manage the calling org's Anthropic API key.
// GET    → { hasKey, last4 }         (never returns the key itself)
// POST   → { key }  saves it (encrypted, server-only)
// DELETE → removes it
//
// The key is written with the service-role client so it lands in org_secrets,
// which no normal client can read. The browser only ever sees hasKey / last4.

async function resolveOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data } = await db.from("users").select("organization_id").eq("id", user.id).single();
  return (data as { organization_id: string } | null)?.organization_id ?? null;
}

export async function GET() {
  const orgId = await resolveOrgId();
  if (!orgId) return new Response("Unauthorized", { status: 401 });
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_secrets")
    .select("anthropic_key_last4, anthropic_key_ciphertext")
    .eq("organization_id", orgId)
    .maybeSingle();
  const row = data as { anthropic_key_last4: string | null; anthropic_key_ciphertext: string | null } | null;
  return Response.json({ hasKey: !!row?.anthropic_key_ciphertext, last4: row?.anthropic_key_last4 ?? null });
}

export async function POST(req: Request) {
  const orgId = await resolveOrgId();
  if (!orgId) return new Response("Unauthorized", { status: 401 });

  const { key } = await req.json() as { key?: string };
  const trimmed = (key ?? "").trim();
  if (!trimmed.startsWith("sk-")) {
    return new Response("That does not look like an Anthropic API key (expected to start with 'sk-').", { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("org_secrets").upsert({
    organization_id: orgId,
    anthropic_key_ciphertext: encryptSecret(trimmed),
    anthropic_key_last4: last4(trimmed),
    updated_at: new Date().toISOString(),
  });
  if (error) return new Response("Failed to save key", { status: 500 });
  return Response.json({ hasKey: true, last4: last4(trimmed) });
}

export async function DELETE() {
  const orgId = await resolveOrgId();
  if (!orgId) return new Response("Unauthorized", { status: 401 });
  const svc = createServiceClient();
  await svc.from("org_secrets").delete().eq("organization_id", orgId);
  return Response.json({ hasKey: false, last4: null });
}
