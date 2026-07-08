import crypto from "crypto";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";

// Operator management actions, admin-only:
//   remove_org   — delete an org and everything under it (members' rows, deals,
//                  code, secrets — all cascade). Members' auth accounts persist
//                  but become org-less (harmless; they can't get back in without
//                  a new invite).
//   rotate_code  — replace an org's invite code (kills the old one).
//   remove_user  — delete an auth account by email (clears limbo/unconfirmed
//                  users and removes an individual member).

function makeCode(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "org";
  return `${slug}-${crypto.randomBytes(4).toString("hex").slice(0, 6)}`;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const body = await req.json() as {
    action: "remove_org" | "rotate_code" | "remove_user";
    organizationId?: string;
    orgName?: string;
    email?: string;
  };
  const svc = createServiceClient();

  if (body.action === "remove_org") {
    if (!body.organizationId) return new Response("Missing organizationId", { status: 400 });
    const { error } = await svc.from("organizations").delete().eq("id", body.organizationId);
    if (error) return new Response("Failed to remove organisation", { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "rotate_code") {
    if (!body.organizationId) return new Response("Missing organizationId", { status: 400 });
    const code = makeCode(body.orgName || "org");
    await svc.from("org_invites").delete().eq("organization_id", body.organizationId);
    const { error } = await svc.from("org_invites").insert({
      code, organization_id: body.organizationId, label: body.orgName ?? null,
    });
    if (error) return new Response("Failed to rotate code", { status: 500 });
    return Response.json({ ok: true, code });
  }

  if (body.action === "remove_user") {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email) return new Response("Missing email", { status: 400 });
    // Find the auth user by email (beta scale: one page is plenty).
    const { data: list } = await svc.auth.admin.listUsers();
    const user = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (!user) return new Response("No user with that email", { status: 404 });
    await svc.from("users").delete().eq("id", user.id);  // membership row (if any)
    const { error } = await svc.auth.admin.deleteUser(user.id);
    if (error) return new Response("Failed to remove user", { status: 500 });
    return Response.json({ ok: true });
  }

  return new Response("Unknown action", { status: 400 });
}
