/**
 * Eval runner for the debrief agent.
 *
 *   npx tsx evals/debrief/run.ts --dry-run     # validate cases + grader, spends nothing
 *   npx tsx evals/debrief/run.ts               # full pass against ANTHROPIC_API_KEY
 *   npx tsx evals/debrief/run.ts --reps 2 --variant v1
 *
 * Writes .claude/hillclimb/debrief/<variant>/{results.jsonl,errors.jsonl,traces/}.
 * Rows are written as each case finishes and resume is idempotent at the
 * (case, rep) key, so a crash costs nothing already paid for.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDebriefAgent, type DebriefResult } from "@/lib/agents/debrief";
import { DEFAULT_MODELS, estimateCallCost } from "@/lib/agents/models";
import { gradeCase, METRICS, type EvalCase } from "./grade";
import type { DealFull } from "@/lib/supabase/types";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

const argv = process.argv.slice(2);
const flag = (name: string, fallback?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const DRY = argv.includes("--dry-run");
const VARIANT = flag("variant", "baseline")!;
const REPS = Number(flag("reps", "1"));
const MODEL = flag("model", DEFAULT_MODELS.debrief)!;
const CONCURRENCY = Number(flag("concurrency", "4"));
const CASE_TIMEOUT_MS = Number(flag("timeout", "180")) * 1000;

const OUT = join(ROOT, ".claude", "hillclimb", "debrief", VARIANT);
const TRACES = join(OUT, "traces");

function loadCases(): EvalCase[] {
  const dir = join(HERE, "cases");
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as EvalCase);
}

/** Minimal DealFull the debrief prompt actually reads. */
function toDeal(c: EvalCase): DealFull {
  return {
    name: c.deal.deal_name,
    stage: c.deal.stage,
    pain: c.deal.pain,
    success_criteria: c.deal.success_criteria,
    economic_buyer_met: c.deal.economic_buyer_met,
    account: { name: c.deal.account_name },
    economic_buyer: c.deal.economic_buyer_name ? { name: c.deal.economic_buyer_name } : null,
    deal_contacts: c.deal.contacts.map((ct) => ({ role: ct.role, contact: { name: ct.name } })),
    ...c.deal.meddpicc,
  } as unknown as DealFull;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const ceiling = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error(`timeout after ${ms}ms: ${label}`)), ms);
  });
  try {
    return await Promise.race([p, ceiling]);
  } finally {
    clearTimeout(timer!);
  }
}

interface Attempt {
  result: DebriefResult
  usage: Anthropic.Usage
  model: string
  retries: number
  latency_s: number
}

async function runOne(client: Anthropic, c: EvalCase): Promise<Attempt> {
  const maxAttempts = 4;
  let retries = 0;
  for (let attempt = 1; ; attempt++) {
    const started = Date.now();
    try {
      const r = await withTimeout(
        runDebriefAgent(client, toDeal(c), c.transcript, MODEL),
        CASE_TIMEOUT_MS, c.id,
      );
      // A silently substituted model invalidates the comparison.
      if (r.model && !r.model.startsWith(MODEL.split("-2")[0])) {
        throw new Error(`served model ${r.model} != requested ${MODEL}`);
      }
      return { ...r, retries, latency_s: (Date.now() - started) / 1000 };
    } catch (e) {
      const status = (e as { status?: number })?.status;
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!retryable || attempt >= maxAttempts) throw e;
      retries += 1;
      await sleep(Math.min(30_000, 2 ** attempt * 1000) * (0.5 + Math.random()));
    }
  }
}

async function main() {
  const cases = loadCases();
  console.log(`${cases.length} cases · variant=${VARIANT} · model=${MODEL} · reps=${REPS}`);

  if (DRY) {
    // Exercise the grader against a deliberately wrong output so a broken
    // grader surfaces before anything is paid for.
    const empty: DebriefResult = {
      meddpicc_updates: [], health_updates: [], new_contacts: [],
      agent_summary: "", key_signals: [],
    };
    for (const c of cases) {
      const g = gradeCase(c, empty);
      console.log(`  ${c.id.padEnd(28)} empty-output pass=${g.grade.pass} recall=${g.grade.recall.toFixed(2)} — ${g.explanation.pass}`);
    }
    console.log("\nDry run only. No API calls made, nothing spent.");
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Refusing to run.");
    process.exit(1);
  }

  mkdirSync(TRACES, { recursive: true });
  const resultsPath = join(OUT, "results.jsonl");
  const errorsPath = join(OUT, "errors.jsonl");

  // Resume: skip (case, rep) pairs already written.
  const done = new Set<string>();
  if (existsSync(resultsPath)) {
    for (const line of readFileSync(resultsPath, "utf8").split("\n").filter(Boolean)) {
      const row = JSON.parse(line) as { prompt_id: string; rep: number };
      done.add(`${row.prompt_id}#${row.rep}`);
    }
    if (done.size) console.log(`resuming — ${done.size} (case, rep) already complete`);
  }

  writeFileSync(join(OUT, "..", "_state.json"), JSON.stringify({
    flow: "debrief",
    metrics: METRICS,
    perf_fields: ["latency_s", "usage"],
  }, null, 2));

  const client = new Anthropic();
  const jobs: Array<{ c: EvalCase; rep: number }> = [];
  for (const c of cases) for (let rep = 0; rep < REPS; rep++) {
    if (!done.has(`${c.id}#${rep}`)) jobs.push({ c, rep });
  }

  let inFlight = 0, i = 0, spend = 0;
  const scores: number[] = [];

  async function worker() {
    while (i < jobs.length) {
      const { c, rep } = jobs[i++];
      inFlight++;
      try {
        const a = await runOne(client, c);
        const g = gradeCase(c, a.result);
        const cost = estimateCallCost(a.model, a.usage as never);
        spend += cost;
        scores.push(g.grade.pass);

        appendFileSync(resultsPath, JSON.stringify({
          prompt_id: c.id, rep, prompt: c.transcript, tags: c.tags,
          model: a.model, stop_reason: "tool_use", status: "ok",
          grade: g.grade, explanation: g.explanation,
          latency_s: a.latency_s, retries: a.retries, usage: a.usage,
          meta: { note: c.note },
        }) + "\n");

        writeFileSync(join(TRACES, `${c.id}_rep${rep}.json`), JSON.stringify([
          { role: "user", content: c.transcript },
          { role: "tool_call", name: "extract_meddpicc_updates", content: JSON.stringify(a.result, null, 2) },
        ], null, 2));

        console.log(`  ${g.grade.pass ? "PASS" : "FAIL"} ${c.id} rep${rep} — ${g.explanation.pass}`);
      } catch (e) {
        appendFileSync(errorsPath, JSON.stringify({
          prompt_id: c.id, rep, failure_class:
            /timeout/.test(String(e)) ? "timeout" : "harness_or_serving_error",
          error: String(e),
        }) + "\n");
        console.log(`  ERROR ${c.id} rep${rep} — ${e}`);
      } finally {
        inFlight--;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

  const n = scores.length;
  const mean = n ? scores.reduce((a, b) => a + b, 0) / n : 0;
  // Wald interval — rough, but enough to tell signal from noise at this size.
  const ci = n ? 1.96 * Math.sqrt((mean * (1 - mean)) / n) : 0;
  console.log(
    `\npass ${(mean * 100).toFixed(0)}% ± ${(ci * 100).toFixed(0)} (n=${n}) · ` +
    `estimated spend $${spend.toFixed(3)} · results in ${OUT}`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
