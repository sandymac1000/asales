# Debrief agent eval

The debrief agent is the only agent whose output is written into deal records,
so it is the one worth measuring first. Its output is a structured tool call
over a closed set of field names, which means grading can be programmatic —
no judge, no judge cost, no judge drift.

## Running

```bash
npx tsx evals/debrief/run.ts --dry-run   # validates cases + grader, spends nothing
npx tsx evals/debrief/run.ts             # full pass, uses ANTHROPIC_API_KEY
npx tsx evals/debrief/run.ts --reps 2 --variant v1 --model claude-opus-5
```

Results land in `.claude/hillclimb/debrief/<variant>/` as `results.jsonl`,
`errors.jsonl` and `traces/`.

## What it measures

`pass` is the headline and is deliberately strict — a case passes only if every
other check does. The rest are reported separately so a regression shows *which*
way the agent moved:

| Metric | Question |
|---|---|
| `precision` | Did it propose fields the transcript did not license? |
| `recall` | Did it catch what a competent reader could not miss? |
| `restraint` | Did it stay under the cap on a case where little was said? |
| `no_halluc` | Is every proposed contact actually named in the transcript? |
| `confidence_ok` | Is everything above the 0.5 gate, and are the obvious ones confident? |

Precision and restraint matter more than recall here. A missed field is a
human's job to notice; an invented one is a wrong fact written into a customer
record on the strength of an Apply button.

## Known limits

- **Four cases is a seed, not an eval.** The noise floor on a pass rate is
  roughly `1/sqrt(n · reps)`, so four cases is about ±50 points — enough to
  smoke-test the harness, nowhere near enough to make a deploy decision or to
  hill-climb against. Fifteen to a hundred is the target.
- **The cases are synthetic.** They are written against the domain language in
  `lib/agents/domain-playbooks.ts`, not drawn from real calls, so they are
  lower fidelity than anonymised production transcripts would be.
- **An agent that returns nothing scores 2/4.** Two of the four cases are
  restraint cases where silence is correct. That is the right grading, but it
  means the set needs more extraction cases before the number means anything.
