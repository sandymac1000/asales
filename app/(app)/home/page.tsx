import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HomeClient } from "./home-client";
import type { Organization } from "@/lib/supabase/types";
import { ACTIVE_STAGES } from "@/lib/format";

export const dynamic = "force-dynamic";

function getQuarterRange(year: number, q: number) {
  const start = new Date(year, (q - 1) * 3, 1);
  const end = new Date(year, q * 3, 0, 23, 59, 59);
  return { start, end };
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profileRaw } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileRaw as { organization_id: string } | null)?.organization_id;

  const [{ data: orgRaw }, { data: activeRaw }] = await Promise.all([
    orgId
      ? db.from("organizations")
          .select("q1_target_acv,q2_target_acv,q3_target_acv,q4_target_acv,annual_target_acv")
          .eq("id", orgId).single()
      : { data: null },
    db.from("deals")
      .select("stage, acv_value, next_action_date")
      .in("stage", ACTIVE_STAGES),
  ]);

  const now = new Date();
  const year = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;

  // Won ACV per quarter
  const wonByQ: number[] = [0, 0, 0, 0];
  await Promise.all([1, 2, 3, 4].map(async (q) => {
    const { start, end } = getQuarterRange(year, q);
    const { data } = await db.from("deals")
      .select("acv_value").eq("stage", "won")
      .gte("closed_at", start.toISOString())
      .lte("closed_at", end.toISOString());
    wonByQ[q - 1] = ((data ?? []) as { acv_value: number | null }[])
      .reduce((s, d) => s + (d.acv_value ?? 0), 0);
  }));

  type OrgTargets = Pick<Organization,
    "q1_target_acv" | "q2_target_acv" | "q3_target_acv" | "q4_target_acv" | "annual_target_acv">;
  const org = orgRaw as OrgTargets | null;

  const targets = [
    org?.q1_target_acv ?? null,
    org?.q2_target_acv ?? null,
    org?.q3_target_acv ?? null,
    org?.q4_target_acv ?? null,
  ];

  type ActiveDeal = { stage: string; acv_value: number | null; next_action_date: string | null };
  const active = (activeRaw ?? []) as ActiveDeal[];

  const stageGroups = ACTIVE_STAGES.map((stage) => {
    const deals = active.filter((d) => d.stage === stage);
    return {
      stage,
      count: deals.length,
      acv: deals.reduce((s, d) => s + (d.acv_value ?? 0), 0),
    };
  });

  const overdueCount = active.filter((d) =>
    d.next_action_date && new Date(d.next_action_date) < now
  ).length;

  const todayStr = now.toISOString().split("T")[0];
  const dueTodayCount = active.filter((d) =>
    d.next_action_date && d.next_action_date.startsWith(todayStr)
  ).length;

  const pipelineAcv = active.reduce((s, d) => s + (d.acv_value ?? 0), 0);
  const currentWon = wonByQ[currentQ - 1];
  const currentTarget = targets[currentQ - 1];
  const annualTarget = org?.annual_target_acv ?? null;

  return (
    <HomeClient
      year={year}
      currentQ={currentQ}
      wonByQ={wonByQ}
      targets={targets}
      annualTarget={annualTarget}
      currentWon={currentWon}
      currentTarget={currentTarget}
      pipelineAcv={pipelineAcv}
      stageGroups={stageGroups}
      overdueCount={overdueCount}
      dueTodayCount={dueTodayCount}
    />
  );
}
