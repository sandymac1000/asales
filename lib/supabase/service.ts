import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client for server-only use. Bypasses RLS, so it must
// NEVER be imported into client components. Used to read/write org_secrets,
// which no normal client is permitted to touch.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service client not configured (missing URL or SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
