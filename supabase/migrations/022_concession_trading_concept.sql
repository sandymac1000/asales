-- ============================================================
-- Learn concept: Trading Concessions
-- ============================================================
-- Commercial craft rather than vertical knowledge. The nine domain playbooks
-- describe the buyer's world; nothing yet describes how to negotiate in it.
-- This sits at tier -1 with the other commercial foundations (pricing,
-- deal structure, margin) because its whole point is that the work happens
-- BEFORE the negotiation, not during it.

insert into concepts (
  slug, title, short_explanation, full_explanation,
  test_question, red_pattern, green_pattern, failure_anecdote, tier, sort_order
) values (
  'concession_trading',
  'Trading Concessions',
  'Negotiation is not haggling over price. It is trading things that cost you little for things that cost them a lot — decided and priced before the meeting, not invented inside it. Done properly, the buyer stops negotiating on price without noticing they have stopped.',
  'Most founders arrive at a negotiation with one lever: price. The buyer knows this, and pushes on it, because it is the only surface available. Every pound of movement comes straight off your margin.

Experienced counterparties arrive with a list. Not of prices, but of everything in the contract that can move:

- Field of use — which applications or segments they may deploy it in
- Geography and territory — where it may be used, and by which entities
- Intellectual property — background versus foreground, who owns improvements, licence versus assignment
- Warranties, liability caps and indemnities
- Exclusivity, in a segment, a territory, or a period
- Term, renewal and termination for convenience
- Continuity — source code escrow, transition assistance, data portability
- Audit rights, support levels, data rights, publication rights

Score each one on two axes: what it genuinely costs you, and what it appears to be worth to them. The ones that are cheap to you and expensive-looking to them are your currency. Escrow often costs nothing and reassures enormously. A field-of-use restriction can cost nothing this year and cap your addressable market for a decade — those are the ones to price carefully, because they feel free and are not.

Then bundle. Do not concede one item at a time, because a single concession leaves the pressure exactly where it was: on price. Cluster the tradables into two or three coherent packages, each priced in advance. The buyer asking for more does not get a discount; they get moved to a different package, with a different price.

That is the mechanism. A package is a different product, not a smaller version of the same one, so the price moving with it is legitimate rather than opportunistic. The conversation stops being about what you will knock off and starts being about what they would like to buy. Buyers frequently end up paying considerably more than the opening number while feeling they won — because they did win, on the terms they cared about.

Two cautions. Sophisticated procurement teams have seen this and will anchor on your top package and negotiate downwards, so your highest tier must be one you are genuinely happy to sell. And where buying runs through a framework — Crown Commercial, G-Cloud, a corporate master agreement — the terms are frequently not yours to trade at all, and the whole approach collapses. Know which situation you are in before you start.',
  'Name three things in your contract you could concede that would cost you almost nothing, roughly what each appears to be worth to the buyer, and what you would ask for in return for each.',
  'The founder negotiates on price alone, because it is the only variable they have thought about. Concessions are invented in the room under pressure and given away singly, with nothing asked in return. Field-of-use, geography or exclusivity are conceded because they cost nothing today, with no view of what they foreclose later. The founder cannot say what any term in their own contract is worth to them.',
  'The founder has a prepared list of tradables, each scored for its real cost and its perceived value. Concessions travel in priced bundles, not one at a time, and nothing is given without something asked. They know which terms look cheap now and are expensive later, and they can tell you which of their packages they would be glad to sell at the top of the range.',
  'A founder opened at £60k for an enterprise licence and the buyer pushed hard on price, as buyers do. Rather than discount, the founder offered a second package: source code escrow, a wider territory and an extended warranty — all things that cost the business almost nothing to provide — at £85k. The buyer took it to their team and came back wanting foreground IP on the integrations built for them and a tighter liability cap. That was package three, at £120k, and they signed it. At no point in six weeks did the conversation return to the original price. The buyer got every term they had asked for, and the deal closed at twice the opening number, because each thing they wanted had already been costed before anyone sat down.',
  -1,
  90
)
on conflict (slug) do update set
  title = excluded.title,
  short_explanation = excluded.short_explanation,
  full_explanation = excluded.full_explanation,
  test_question = excluded.test_question,
  red_pattern = excluded.red_pattern,
  green_pattern = excluded.green_pattern,
  failure_anecdote = excluded.failure_anecdote,
  tier = excluded.tier,
  sort_order = excluded.sort_order;
