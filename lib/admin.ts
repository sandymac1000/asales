import { createClient } from "@/lib/supabase/server";

// The global operator allow-list. Comma-separated emails in ADMIN_EMAILS.
// An admin sees ALL orgs' metadata — this is a whole-system role, so keep the
// list to the operator(s) only. There is no per-portfolio scoping here.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

// Resolve the current user and confirm they're an admin.
// Returns the user's email if admin, else null. Use at the top of every
// admin page/route before touching cross-org data.
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isAdminEmail(user?.email) ? (user!.email as string) : null;
}
