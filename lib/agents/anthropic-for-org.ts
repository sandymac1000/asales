import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";
import { decryptSecret } from "@/lib/crypto";

// Thrown when an org has not configured its own Anthropic API key.
// Agent routes catch this and return a 409 the UI turns into an "add your key"
// prompt — no agent call is ever billed to the app owner.
export class NoKeyError extends Error {
  constructor() {
    super("This organisation has not set an Anthropic API key.");
    this.name = "NoKeyError";
  }
}

// Returns an Anthropic client keyed to the org's own API key.
// Throws NoKeyError if none is stored.
export async function getOrgAnthropic(orgId: string): Promise<Anthropic> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_secrets")
    .select("anthropic_key_ciphertext")
    .eq("organization_id", orgId)
    .maybeSingle();

  const ciphertext = (data as { anthropic_key_ciphertext: string | null } | null)?.anthropic_key_ciphertext;
  if (!ciphertext) throw new NoKeyError();

  return new Anthropic({ apiKey: decryptSecret(ciphertext) });
}

// Helper for routes: resolve the caller's org id, then their org's client.
// Returns { anthropic, orgId } or a Response (the caller returns it directly).
export function noKeyResponse(): Response {
  return new Response(
    "Add your organisation's Anthropic API key in Settings to enable the agents.",
    { status: 409 }
  );
}
