import { createClient } from "@/lib/supabase/server";

// Send in-app feedback to the operator's inbox via Resend's REST API.
// No SDK dependency; uses onboarding@resend.dev so it works to your own
// address without domain verification. Requires RESEND_API_KEY + FEEDBACK_EMAIL.

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { message } = await req.json() as { message?: string };
  const body = (message ?? "").trim();
  if (!body) return new Response("Empty feedback", { status: 400 });

  // Best-effort org label for context.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profile as { organization_id: string } | null)?.organization_id ?? "unknown";
  let orgName = "unknown";
  if (orgId !== "unknown") {
    const { data: org } = await db.from("organizations").select("name").eq("id", orgId).single();
    orgName = (org as { name: string } | null)?.name ?? "unknown";
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_EMAIL;
  if (!apiKey || !to) {
    return new Response("Feedback is not configured on this deployment.", { status: 501 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Salient Feedback <onboarding@resend.dev>",
      to: [to],
      reply_to: user.email,
      subject: `Salient feedback — ${orgName}`,
      text: `From: ${user.email} (org: ${orgName})\n\n${body}`,
    }),
  });

  if (!res.ok) return new Response("Could not send feedback. Please try again.", { status: 502 });
  return Response.json({ ok: true });
}
