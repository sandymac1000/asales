import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { runQualificationAgent } from "@/lib/agents/qualify";
import { getOrgAnthropic, NoKeyError, noKeyResponse } from "@/lib/agents/anthropic-for-org";
import type { Deal, Activity } from "@/lib/supabase/types";

const MEDDPICC_FIELDS = [
  "meddpicc_metrics",
  "meddpicc_eb",
  "meddpicc_pain",
  "meddpicc_champion",
  "meddpicc_decision_criteria",
  "meddpicc_decision_process",
  "meddpicc_paper_process",
  "meddpicc_competition",
];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deal_id } = await request.json() as { deal_id: string };
  if (!deal_id) return NextResponse.json({ error: "deal_id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: dealRaw } = await db.from("deals").select("*").eq("id", deal_id).single();
  if (!dealRaw) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const deal = dealRaw as unknown as Deal;

  // Compute field ages from activities
  const { data: activitiesRaw } = await db
    .from("activities")
    .select("*")
    .eq("deal_id", deal_id)
    .order("created_at", { ascending: false });

  const activities = (activitiesRaw ?? []) as unknown as Activity[];
  const now = Date.now();

  const fieldAges: Record<string, number> = {};
  for (const field of MEDDPICC_FIELDS) {
    // Find most recent activity that mentions this dimension
    const label = field.replace("meddpicc_", "").replace(/_/g, " ");
    const recent = activities.find(
      (a) => a.notes?.toLowerCase().includes(label) || a.type === "note"
    );
    if (recent) {
      const ageMs = now - new Date(recent.created_at).getTime();
      fieldAges[field] = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }
  }

  // Load org model preference
  const { data: profileRaw } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileRaw as { organization_id: string } | null)?.organization_id;
  let qualifyModel = "claude-sonnet-4-6";
  if (orgId) {
    const { data: orgRaw } = await db.from("organizations").select("agent_models").eq("id", orgId).single();
    const agentModels = (orgRaw as { agent_models: Record<string, string> | null } | null)?.agent_models;
    if (agentModels?.qualify) qualifyModel = agentModels.qualify;
  }

  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });
  let anthropic;
  try {
    anthropic = await getOrgAnthropic(orgId);
  } catch (e) {
    if (e instanceof NoKeyError) return noKeyResponse();
    throw e;
  }

  try {
    const result = await runQualificationAgent(anthropic, deal, fieldAges, qualifyModel);

    // Persist score to deal
    await db
      .from("deals")
      .update({ qualification_score: result.score })
      .eq("id", deal_id);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Qualification agent error:", err);
    return NextResponse.json(
      { error: "Could not compute qualification score. Try again or check your AI key." },
      { status: 500 }
    );
  }
}
