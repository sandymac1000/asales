import { createServiceClient } from "@/lib/supabase/service";
import type {
  AdminSignupsDaily, AdminDealsDaily,
  AdminLoginRecency, AdminLoginsDaily, LoginRecencyBucket,
} from "@/lib/supabase/types";

// Server-only shaping for the operator-console charts. Reads the 019 views
// with the service role, so it must never be imported into a client
// component — pass the returned plain objects down as props instead.
//
// Everything here is metadata: counts and dates. No deal contents, no keys.

export interface AdoptionPoint {
  /** Monday of the week, as YYYY-MM-DD (UTC). */
  week: string
  /** Cumulative members across all orgs at the end of that week. */
  members: number
  /** Cumulative deals across all orgs at the end of that week. */
  deals: number
}

export interface LoginDayPoint {
  day: string
  logins: number
  actors: number
}

export interface UsageCharts {
  adoption: AdoptionPoint[]
  recency: Record<LoginRecencyBucket, number>
  loginsDaily: LoginDayPoint[]
  /** organization_id → logins in the last 30 days. Feeds the usage table. */
  loginsByOrg: Record<string, number>
  /** How far back the audit log actually goes, in days. 0 when it's empty. */
  auditWindowDays: number
  /**
   * False when the 019 views aren't there yet — so /admin can say "run the
   * migration" instead of drawing four convincingly empty charts.
   */
  ready: boolean
}

const DAY_MS = 86_400_000;

/** Parse a YYYY-MM-DD view date as UTC midnight, never local midnight. */
function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `day`. */
function weekStart(day: string): string {
  const d = parseDay(day);
  // getUTCDay: 0 = Sunday, so Sunday belongs to the week that began 6 days ago.
  const back = (d.getUTCDay() + 6) % 7;
  return toDay(new Date(d.getTime() - back * DAY_MS));
}

/**
 * Cumulative members and deals by week, across all orgs.
 *
 * Weeks with no activity are filled in so the line doesn't imply a gap in
 * time, and the totals carry forward — cumulative counts can only ever climb.
 */
function buildAdoption(
  signups: AdminSignupsDaily[],
  deals: AdminDealsDaily[],
): AdoptionPoint[] {
  const perWeek = new Map<string, { members: number; deals: number }>();
  const bump = (day: string, key: "members" | "deals", n: number) => {
    const w = weekStart(day);
    const row = perWeek.get(w) ?? { members: 0, deals: 0 };
    row[key] += n;
    perWeek.set(w, row);
  };
  for (const s of signups) bump(s.day, "members", s.members);
  for (const d of deals) bump(d.day, "deals", d.deals);
  if (perWeek.size === 0) return [];

  const weeks = [...perWeek.keys()].sort();
  const out: AdoptionPoint[] = [];
  let members = 0;
  let deals_ = 0;
  for (
    let t = parseDay(weeks[0]).getTime(), end = parseDay(weeks[weeks.length - 1]).getTime();
    t <= end;
    t += 7 * DAY_MS
  ) {
    const w = toDay(new Date(t));
    const row = perWeek.get(w);
    members += row?.members ?? 0;
    deals_ += row?.deals ?? 0;
    out.push({ week: w, members, deals: deals_ });
  }
  return out;
}

/**
 * Logins per day, gap-filled across the range the audit log actually covers.
 *
 * A filled zero means "the log is retained for this day and nobody signed in".
 * Outside the returned range we know nothing — Supabase prunes the log — which
 * is why the range is derived from the data rather than fixed at 90 days.
 */
function buildLoginsDaily(rows: AdminLoginsDaily[]): LoginDayPoint[] {
  if (rows.length === 0) return [];
  const perDay = new Map<string, { logins: number; actors: number }>();
  for (const r of rows) {
    const row = perDay.get(r.day) ?? { logins: 0, actors: 0 };
    row.logins += r.logins;
    // Distinct actors are per-org in the view; summing over orgs is still a
    // distinct count, because a user belongs to exactly one org.
    row.actors += r.actors;
    perDay.set(r.day, row);
  }
  const days = [...perDay.keys()].sort();
  const out: LoginDayPoint[] = [];
  for (
    let t = parseDay(days[0]).getTime(), end = parseDay(days[days.length - 1]).getTime();
    t <= end;
    t += DAY_MS
  ) {
    const day = toDay(new Date(t));
    const row = perDay.get(day);
    out.push({ day, logins: row?.logins ?? 0, actors: row?.actors ?? 0 });
  }
  return out;
}

const EMPTY_RECENCY: Record<LoginRecencyBucket, number> = {
  today: 0, week: 0, month: 0, dormant: 0, never: 0,
};

export async function getUsageCharts(): Promise<UsageCharts> {
  const svc = createServiceClient();
  const [signupsRes, dealsRes, recencyRes, loginsRes] = await Promise.all([
    svc.from("admin_signups_daily").select("*"),
    svc.from("admin_deals_daily").select("*"),
    svc.from("admin_login_recency").select("*"),
    svc.from("admin_logins_daily").select("*"),
  ]);

  // A missing view (migration not yet run) errors rather than returning rows.
  // Treat "every view failed" as not-installed; a single failure is a real
  // fault worth logging, and that chart simply comes back empty.
  const results = [signupsRes, dealsRes, recencyRes, loginsRes];
  const failed = results.filter((r) => r.error);
  for (const r of failed) console.error("[admin-usage] view read failed:", r.error?.message);
  const ready = failed.length < results.length;

  const signups = (signupsRes.data ?? []) as AdminSignupsDaily[];
  const deals = (dealsRes.data ?? []) as AdminDealsDaily[];
  const recencyRows = (recencyRes.data ?? []) as AdminLoginRecency[];
  const loginRows = (loginsRes.data ?? []) as AdminLoginsDaily[];

  const recency = { ...EMPTY_RECENCY };
  for (const r of recencyRows) {
    if (r.bucket in recency) recency[r.bucket] += r.users;
  }

  // Per-org logins over the last 30 days, for the usage table's extra column.
  const cutoff = toDay(new Date(Date.now() - 30 * DAY_MS));
  const loginsByOrg: Record<string, number> = {};
  for (const r of loginRows) {
    if (r.day < cutoff) continue;
    loginsByOrg[r.organization_id] = (loginsByOrg[r.organization_id] ?? 0) + r.logins;
  }

  const loginsDaily = buildLoginsDaily(loginRows);
  const auditWindowDays = loginsDaily.length;

  return {
    adoption: buildAdoption(signups, deals),
    recency,
    loginsDaily,
    loginsByOrg,
    auditWindowDays,
    ready,
  };
}
