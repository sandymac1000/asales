-- ============================================================
-- Sync the ICP concept card with the market-segments feature
-- ============================================================
-- The app now models ICP as a core buyer plus adjacencies with a
-- confidence that updates on deal evidence (migration 015). The book
-- gained a matching "Your ICP Is a Portfolio, Not a Bet" subsection.
-- This brings the didactic concept card into line so the book, the
-- Learn content, and the live market agent tell one story.

update concepts
set
  short_explanation = 'An ICP is not a target market — it is the specific customer who has your problem most acutely, buys fastest, and expands. Hold it as a small portfolio: one core buyer plus adjacencies (same tech, different role; or same value, different vertical), each with a confidence that moves as deals are won or lost.',
  full_explanation = full_explanation || E'\n\n### Your ICP is a portfolio, not a bet\n\nDefining one precise ICP is the right discipline of focus — but do not marry the first profile you write down. Your technology often creates value somewhere you did not predict.\n\nHold your ICP as a small portfolio: one **core** buyer (highest conviction and evidence, where most effort goes) plus a handful of **adjacencies** held as hypotheses, not commitments. Adjacencies run along two axes:\n\n- **Adjacent buyer** — the same technology, a different role (e.g. a code-generation tool whose core buyer is the Head of Engineering may also serve a platform team, QA/test-automation, or application security).\n- **Adjacent market** — the same value, a different vertical; the buyer title and trigger change, the underlying value does not.\n\nEach adjacency carries a confidence — kept coarse and honest (strong / plausible / speculative), never a false precision like "37%". What matters is that it **moves on evidence**: a deal won in an adjacency raises it; an adjacency that stalls repeatedly should decay. This is the principle of deriving your ICP from your first customers, made continuous — run the core hard, probe adjacencies cheaply, and let outcomes promote or kill each hypothesis. In Salient, this lives in Settings → Market & buyers (segment hypotheses) and updates automatically as you tag deals and close them.'
where slug = 'ideal_customer_profile';
