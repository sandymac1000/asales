import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineClient } from "./pipeline-client";
import type { DealWithAccount, Health, Organization } from "@/lib/supabase/types";
import { ACTIVE_STAGES } from "@/lib/format";

export const dynamic = "force-dynamic";

function getQuarterRange(now: Date) {
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 0, 23, 59, 59);
  return { start, end, label: `Q${quarter + 1} ${year}` };
}

function getYearRange(now: Date) {
  const year = now.getFullYear();
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59),
    label: String(year),
  };
}

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Active pipeline deals
  const { data: raw } = await db
    .from("deals")
    .select(`*, account:accounts(*), economic_buyer:contacts(*)`)
    .in("stage", ACTIVE_STAGES)
    .order("created_at", { ascending: false });

  const deals = ((raw ?? []) as unknown as DealWithAccount[]).map((d) => ({
    ...d,
    meddpicc_healths: [
      d.meddpicc_metrics_health,
      d.meddpicc_eb_health,
      d.meddpicc_pain_health,
      d.meddpicc_champion_health,
      d.meddpicc_decision_criteria_health,
      d.meddpicc_decision_process_health,
      d.meddpicc_paper_process_health,
      d.meddpicc_competition_health,
    ] as (Health | null)[],
  }));

  // Won deals for forecast
  const now = new Date();
  const qRange = getQuarterRange(now);
  const yRange = getYearRange(now);

  const { data: wonQ } = await db
    .from("deals")
    .select("acv_value")
    .eq("stage", "won")
    .gte("closed_at", qRange.start.toISOString())
    .lte("closed_at", qRange.end.toISOString());

  const { data: wonY } = await db
    .from("deals")
    .select("acv_value")
    .eq("stage", "won")
    .gte("closed_at", yRange.start.toISOString())
    .lte("closed_at", yRange.end.toISOString());

  const wonAcvQ = ((wonQ ?? []) as { acv_value: number | null }[])
    .reduce((sum, d) => sum + (d.acv_value ?? 0), 0);
  const wonAcvY = ((wonY ?? []) as { acv_value: number | null }[])
    .reduce((sum, d) => sum + (d.acv_value ?? 0), 0);

  const pipelineAcv = deals.reduce((sum, d) => sum + (d.acv_value ?? 0), 0);

  // Org for targets
  const { data: profileRaw } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileRaw as { organization_id: string } | null)?.organization_id;

  const { data: orgRaw } = orgId
    ? await db.from("organizations")
        .select("q1_target_acv, q2_target_acv, q3_target_acv, q4_target_acv, annual_target_acv")
        .eq("id", orgId)
        .single()
    : { data: null };

  type OrgTargets = Pick<Organization, "q1_target_acv" | "q2_target_acv" | "q3_target_acv" | "q4_target_acv" | "annual_target_acv">;
  const org = orgRaw as OrgTargets | null;

  // Pick the target for the current quarter
  const currentQ = Math.floor(now.getMonth() / 3) + 1 as 1 | 2 | 3 | 4;
  const qTargetKey = `q${currentQ}_target_acv` as keyof OrgTargets;
  const quarterlyTarget = org?.[qTargetKey] ?? null;

  return (
    <PipelineClient
      deals={deals}
      wonAcvQ={wonAcvQ}
      wonAcvY={wonAcvY}
      pipelineAcv={pipelineAcv}
      quarterLabel={qRange.label}
      yearLabel={yRange.label}
      quarterlyTarget={quarterlyTarget}
      annualTarget={org?.annual_target_acv ?? null}
    />
  );
}
