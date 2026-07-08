import { requireAdmin } from "@/lib/admin";

// Lightweight check so the client can decide whether to show the Admin nav
// link. The real gate is server-side on the admin page/routes; this only
// controls UI visibility.
export async function GET() {
  const admin = await requireAdmin();
  return Response.json({ admin: !!admin });
}
