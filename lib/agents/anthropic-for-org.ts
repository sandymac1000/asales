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

// Standard 409 returned by every agent route when the org has no key.
// JSON so all clients (streaming and JSON) can read { error, code } uniformly.
export const NO_KEY_MESSAGE =
  "No Anthropic key set for your organisation. Add one in Settings → AI access to switch the agents on.";

export function noKeyResponse(): Response {
  return Response.json({ error: NO_KEY_MESSAGE, code: "no_key" }, { status: 409 });
}
