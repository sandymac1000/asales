-- Win/Loss debrief fields on deals
alter table deals add column if not exists win_reason text;
alter table deals add column if not exists win_notes text;
alter table deals add column if not exists loss_category text
  check (loss_category in ('price', 'product', 'timing', 'political', 'no_decision', 'other'));
alter table deals add column if not exists lost_to_competitor text;

-- Pipeline targets on organizations
alter table organizations add column if not exists quarterly_target_acv integer;
alter table organizations add column if not exists annual_target_acv integer;

-- Seed: pipeline coverage concept
insert into concepts (slug, title, short_explanation, full_explanation, test_question, red_pattern, green_pattern, failure_anecdote, tier, sort_order)
values (
  'pipeline_coverage',
  'Pipeline Coverage',
  'The ratio of total pipeline ACV to your remaining quota. You need 3–4× to reliably hit the number.',
  E'## Why 3–4×?\n\nNot every deal in your pipeline will close. Deals slip, go quiet, or lose to a competitor. The coverage ratio is your buffer.\n\n### How to read it\n\n- **Below 2×**: You are in trouble. Close rates rarely exceed 50% across a full pipeline, so sub-2× means you are mathematically unlikely to hit quota.\n- **2–3×**: Tight. Any slippage puts you at risk.\n- **3–4×**: Healthy. You can absorb normal deal mortality.\n- **Above 5×**: The pipeline may be polluted with wishful deals that should be disqualified or moved to nurture.\n\n### Coverage vs. quality\n\nCoverage is not a substitute for qualification. 4× coverage of unqualified deals is worthless. The goal is 3–4× of genuinely qualified, MEDDPICC-scored pipeline.\n\n### When to worry\n\nIf coverage is falling quarter-over-quarter, the pipeline engine is broken — not just this quarter''s number. Fix the top of the funnel before the next period begins.',
  'Your quarterly target is £500k. You have won £100k. You have £800k in active pipeline. What is your coverage, and is it healthy?',
  'Running the quarter with 1.5× coverage and assuming everything will close. Every deal slips by at least one stage.',
  'Maintaining 3–4× coverage at all times, disqualifying deals that go stale rather than letting them clog the pipeline.',
  'A founder had £1.2m in pipeline against a £400k quarterly target — 3× coverage, looked safe. But 70% of it was a single deal that slipped. Real diversified coverage was 0.9×. They missed by £280k.',
  1,
  100
) on conflict (slug) do nothing;

-- Seed: win/loss debrief concept
insert into concepts (slug, title, short_explanation, full_explanation, test_question, red_pattern, green_pattern, failure_anecdote, tier, sort_order)
values (
  'win_loss_debrief',
  'Win/Loss Debrief',
  'Documenting why you won or lost while the memory is fresh. The only way to build a repeatable process.',
  E'## Why debrief immediately?\n\nWithin 48 hours of a deal closing, you remember the real reasons. After two weeks, your brain has already rewritten the story.\n\n### What to capture for a win\n\n- **The decisive factor**: The single thing that tipped the decision in your favour. Often it is not the product — it is trust, timeline, or a specific proof point.\n- **What to repeat**: The specific actions, conversations, or materials that worked. These become your playbook.\n- **Who was essential**: Which internal champion made the difference?\n\n### What to capture for a loss\n\n- **The real reason**: Not the polite reason the prospect gave you. The actual reason.\n- **Loss category**: Price means your price was too high for the value you demonstrated — not that you were expensive. Product means you were missing something they genuinely needed. Timing means the problem was not urgent enough.\n- **Who beat you and why**: Understanding competitors is pattern recognition.\n\n### How this compounds\n\nAfter 20 wins and 20 losses, you will see patterns: which industries close fastest, which champion types are real, which objections are fatal vs. surmountable. This is how sales playbooks are built.',
  'You just lost a deal. The prospect says it was "price." What two questions do you ask to find out if that is the real reason?',
  'Marking a deal won or lost and moving on. The lesson evaporates within days.',
  'Completing a structured debrief within 24 hours. Win reasons become the playbook. Loss reasons become the qualification filter.',
  'A team closed 12 deals in a year. When asked what made them win, every answer was "the product." When they finally debriefed properly, 9 of the 12 wins shared the same pattern: the champion had previously bought from the founder at a previous company. The real repeatable motion was relationship — not product.',
  0,
  101
) on conflict (slug) do nothing;
