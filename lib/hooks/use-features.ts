"use client";

import { useOrg } from "@/lib/hooks/use-org";
import type { Features } from "@/lib/supabase/types";

export function useFeatures(): Features {
  const { org } = useOrg();
  return (
    org?.features ?? {
      tier1_expansion: false,
      tier1_milestones: false,
      tier2_meddpicc_lite: false,
      tier3_meddpicc_full: false,
      tier3_debrief_agent: false,
      tier3_qualification_agent: false,
      pipeline_kanban: false,
    }
  );
}
