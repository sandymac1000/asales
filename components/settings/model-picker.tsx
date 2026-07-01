"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/use-org";

const MODELS = [
  {
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    cost: "$$$$",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    cost: "$$$",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    cost: "$",
  },
] as const;

type AgentModels = { coach: string; debrief: string; qualify: string; scorecard: string };

const AGENTS: {
  key: keyof AgentModels;
  label: string;
  description: string;
  defaultModel: string;
}[] = [
  {
    key: "coach",
    label: "Team Coach",
    description: "Deep coaching sessions on individual deals.",
    defaultModel: "claude-opus-4-8",
  },
  {
    key: "scorecard",
    label: "Value narrative",
    description: "Guided dialogue to build your product and market narratives.",
    defaultModel: "claude-opus-4-8",
  },
  {
    key: "debrief",
    label: "AI Debrief",
    description: "Extracts MEDDPICC updates from meeting transcripts.",
    defaultModel: "claude-opus-4-8",
  },
  {
    key: "qualify",
    label: "Qualification score",
    description: "Scores deal health across MEDDPICC dimensions.",
    defaultModel: "claude-sonnet-4-6",
  },
];

const MODEL_DESCRIPTIONS: Record<string, string> = {
  "claude-opus-4-8": "Most capable. Best for nuanced coaching and complex reasoning.",
  "claude-sonnet-4-6": "Strong capability at lower cost. Good for structured extraction tasks.",
  "claude-haiku-4-5-20251001": "Fast and inexpensive. Best for quick scoring and simple classification.",
};

export function ModelPicker() {
  const { org, refreshOrg } = useOrg();
  const [saving, setSaving] = useState<string | null>(null);

  if (!org) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const models: AgentModels = (org as any).agent_models ?? {
    coach: "claude-opus-4-8",
    debrief: "claude-opus-4-8",
    qualify: "claude-sonnet-4-6",
    scorecard: "claude-opus-4-8",
  };

  async function setModel(agentKey: keyof AgentModels, modelId: string) {
    setSaving(agentKey);
    const next = { ...models, [agentKey]: modelId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any)
      .from("organizations")
      .update({ agent_models: next })
      .eq("id", org!.id);
    await refreshOrg();
    setSaving(null);
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {AGENTS.map((agent) => {
        const currentModel = models[agent.key] ?? agent.defaultModel;
        const modelDesc = MODEL_DESCRIPTIONS[currentModel] ?? "";
        return (
          <div
            key={agent.key}
            className="flex items-start gap-4 bg-card px-5 py-4 border-b border-border last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-0.5">{agent.label}</p>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
              {modelDesc && (
                <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{modelDesc}</p>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
              <select
                value={currentModel}
                disabled={saving === agent.key}
                onChange={(e) => setModel(agent.key, e.target.value)}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.cost}
                  </option>
                ))}
              </select>
              {saving === agent.key && (
                <span className="text-xs text-muted-foreground">Saving…</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
