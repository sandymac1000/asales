"use client";

import { Chart, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend,
} from "chart.js";
import type { UsageCharts } from "@/lib/admin-usage";
import type { LoginRecencyBucket } from "@/lib/supabase/types";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend,
);

// House palette, matching the pipeline charts on /home.
const ACCENT = "#c96442";
const MUTED = "#6b6259";
const GRID = "#f0ece5";
const FONT = "system-ui";

const RECENCY_LABELS: Record<LoginRecencyBucket, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  dormant: "Dormant (30d+)",
  never: "Never signed in",
};
const RECENCY_ORDER: LoginRecencyBucket[] = ["today", "week", "month", "dormant", "never"];

function fmtDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
}

const axes = (yTitle?: string) => ({
  x: {
    grid: { display: false },
    ticks: {
      font: { size: 11, family: FONT }, color: MUTED,
      maxRotation: 0, autoSkipPadding: 12,
    },
    border: { display: false },
  },
  y: {
    beginAtZero: true,
    grid: { color: GRID },
    ticks: {
      font: { size: 11, family: FONT }, color: MUTED,
      precision: 0,
    },
    border: { display: false },
    title: yTitle
      ? { display: true, text: yTitle, font: { size: 10, family: FONT }, color: MUTED }
      : undefined,
  },
});

const legend = {
  position: "top" as const,
  align: "end" as const,
  labels: {
    boxWidth: 10, boxHeight: 10, borderRadius: 2, useBorderRadius: true,
    font: { size: 11, family: FONT }, color: MUTED,
  },
};

function Panel({
  title, note, children, empty,
}: {
  title: string
  note?: string
  children: React.ReactNode
  empty?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {note && <p className="mb-3 text-xs text-muted-foreground">{note}</p>}
      {empty
        ? <p className="py-10 text-center text-xs text-muted-foreground">{empty}</p>
        : <div className="h-52">{children}</div>}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function UsageChartsPanel({ charts }: { charts: UsageCharts }) {
  const { adoption, recency, loginsDaily, auditWindowDays } = charts;

  const latest = adoption.at(-1);
  const activeWeek = recency.today + recency.week;
  const totalUsers = RECENCY_ORDER.reduce((s, b) => s + recency[b], 0);

  const adoptionData = {
    labels: adoption.map((p) => fmtDay(p.week)),
    datasets: [
      {
        label: "Members",
        data: adoption.map((p) => p.members),
        borderColor: ACCENT,
        backgroundColor: ACCENT,
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.25,
      },
      {
        label: "Deals",
        data: adoption.map((p) => p.deals),
        borderColor: MUTED,
        backgroundColor: MUTED,
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.25,
      },
    ],
  };

  const recencyData = {
    labels: RECENCY_ORDER.map((b) => RECENCY_LABELS[b]),
    datasets: [
      {
        label: "People",
        data: RECENCY_ORDER.map((b) => recency[b]),
        backgroundColor: ACCENT,
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
  };

  // Mixed chart: sign-ins as bars, the distinct people behind them as a line.
  // The gap between the two is repeat visits in a day.
  const loginsData = {
    labels: loginsDaily.map((p) => fmtDay(p.day)),
    datasets: [
      {
        type: "bar" as const,
        label: "Sign-ins",
        data: loginsDaily.map((p) => p.logins),
        backgroundColor: ACCENT,
        borderRadius: 3,
        borderSkipped: false as const,
        order: 2,
      },
      {
        type: "line" as const,
        label: "People",
        data: loginsDaily.map((p) => p.actors),
        borderColor: MUTED,
        backgroundColor: MUTED,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        order: 1,
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Members" value={latest?.members ?? totalUsers} />
        <Stat label="Deals" value={latest?.deals ?? 0} />
        <Stat label="Active this week" value={activeWeek} hint={`of ${totalUsers} people`} />
        <Stat
          label="Never signed in"
          value={recency.never}
          hint={recency.never > 0 ? "invited, not yet in" : undefined}
        />
      </div>

      <Panel
        title="Adoption over time"
        note="Cumulative members and deals across all organisations, by week."
        empty={adoption.length === 0 ? "No members or deals yet." : undefined}
      >
        <Line
          data={adoptionData}
          options={{
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: "index" as const, intersect: false },
            plugins: { legend },
            scales: axes(),
          }}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title="Login recency"
          note="When each person last signed in. Dormant and never are the ones to chase."
          empty={totalUsers === 0 ? "No people yet." : undefined}
        >
          <Chart
            type="bar"
            data={recencyData}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: axes("People"),
            }}
          />
        </Panel>

        <Panel
          title="Sign-in frequency"
          note={
            auditWindowDays > 0
              ? `Sign-ins per day over the ${auditWindowDays} day${auditWindowDays === 1 ? "" : "s"} the auth log still covers. Supabase prunes older entries, so this window is shorter than the product's life — a day outside it means no record kept, not no activity.`
              : undefined
          }
          empty={
            loginsDaily.length === 0
              ? "No sign-ins in the retained auth log."
              : undefined
          }
        >
          <Chart
            type="bar"
            data={loginsData}
            options={{
              responsive: true, maintainAspectRatio: false,
              interaction: { mode: "index" as const, intersect: false },
              plugins: { legend },
              scales: axes(),
            }}
          />
        </Panel>
      </div>
    </div>
  );
}
