import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Types are applied at the query call site via explicit annotations.
  // Run `supabase gen types` once the project is connected to generate full types.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
