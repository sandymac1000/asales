import crypto from "crypto";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";

// Provision an organisation + invite code, admin-only. Optionally email the
// invite via Resend. The org + code creation always succeeds; the email is
// best-effort (needs a verified Resend domain to reach external recipients).

function makeCode(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "org";
  const suffix = crypto.randomBytes(4).toString("hex").slice(0, 6);
  return `${slug}-${suffix}`;
}

async function sendInvite(to: string, orgName: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const from = process.env.INVITE_FROM_EMAIL || "Salient <onboarding@resend.dev>";
  if (!apiKey || !appUrl) return false;

  const text = [
    `You've been invited to Salient — a tool for running enterprise sales.`,
    ``,
    `To get in:`,
    `1. Go to ${appUrl}`,
    `2. Enter your email and this invite code (first time only): ${code}`,
    `3. We'll email you a sign-in code — enter it to finish.`,
    ``,
    `Your organisation: ${orgName}. Share the same code with colleagues so they join you.`,
    ``,
    `Please note: this is an early beta / demo system, provided as-is with no`,
    `warranty, no service-level agreement, and no liability of any kind. It may`,
    `change or be reset without notice. Do not rely on it for business-critical`,
    `records, and do not enter anything you are not comfortable storing in a beta.`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `Your Salient invite — ${orgName}`, text }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const { name, email } = await req.json() as { name?: string; email?: string };
  const orgName = (name ?? "").trim();
  if (!orgName) return new Response("Organisation name is required", { status: 400 });
  const recipient = (email ?? "").trim() || null;

  const svc = createServiceClient();

  const { data: org, error: orgErr } = await svc
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();
  if (orgErr || !org) return new Response("Failed to create organisation", { status: 500 });

  const code = makeCode(orgName);
  const { error: invErr } = await svc.from("org_invites").insert({
    code,
    organization_id: (org as { id: string }).id,
    label: orgName,
    sent_to: recipient,
    sent_at: recipient ? new Date().toISOString() : null,
  });
  if (invErr) return new Response("Created org but failed to create invite code", { status: 500 });

  let emailed = false;
  if (recipient) {
    try { emailed = await sendInvite(recipient, orgName, code); } catch { emailed = false; }
  }

  return Response.json({ name: orgName, code, recipient, emailed });
}
