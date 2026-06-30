import type { Stage, Health } from "@/lib/supabase/types";

export const STAGE_LABELS: Record<Stage, string> = {
  exploring: "Exploring",
  qualifying: "Qualifying",
  proposing: "Proposing",
  closing: "Closing",
  won: "Won",
  lost: "Lost",
};

export const STAGE_ORDER: Stage[] = [
  "exploring",
  "qualifying",
  "proposing",
  "closing",
  "won",
  "lost",
];

export const ACTIVE_STAGES: Stage[] = ["exploring", "qualifying", "proposing", "closing"];

export function formatCurrency(
  value: number | null | undefined,
  currency = "GBP"
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function healthColour(health: Health | null | undefined): string {
  if (!health) return "text-muted-foreground";
  return {
    green: "text-health-green",
    amber: "text-health-amber",
    red: "text-health-red",
  }[health];
}

export function healthBg(health: Health | null | undefined): string {
  if (!health) return "bg-muted";
  return {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  }[health];
}

export function worstHealth(healths: (Health | null | undefined)[]): Health | null {
  const defined = healths.filter(Boolean) as Health[];
  if (!defined.length) return null;
  if (defined.includes("red")) return "red";
  if (defined.includes("amber")) return "amber";
  return "green";
}
