// ── COLOURS ──────────────────────────────────────────────────────────────────
#let accent  = rgb("#c96442")
#let bg      = rgb("#faf8f4")
#let surface = rgb("#f2ede4")
#let textcol = rgb("#1c1410")
#let muted   = rgb("#8a7a6e")

// ── CHAPTER STATE ─────────────────────────────────────────────────────────────
#let chapter-state = state("chapter", "Introduction")

// ── PAGE ──────────────────────────────────────────────────────────────────────
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 3cm, inside: 3cm, outside: 2cm),
  background: rect(fill: bg, width: 100%, height: 100%),
  header: context {
    let pg = counter(page).get().first()
    if pg <= 3 { return [] }
    let chap = chapter-state.get()
    set text(size: 7.5pt, fill: muted, font: "Gill Sans")
    if calc.odd(pg) {
      h(1fr)
      smallcaps(chap)
    } else {
      smallcaps("Salient")
    }
    linebreak()
    v(-0.35em)
    line(length: 100%, stroke: 0.4pt + muted)
  },
  footer: context {
    let pg = counter(page).get().first()
    if pg <= 1 { return [] }
    line(length: 100%, stroke: 0.4pt + surface.darken(15%))
    v(0.25em)
    align(center, text(size: 8pt, fill: muted, font: "Gill Sans", str(pg)))
  },
)

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
#set text(font: "Charter", size: 10.5pt, fill: textcol, lang: "en")
#set par(leading: 0.72em, justify: true, spacing: 1.15em)

#show heading.where(level: 2): it => {
  v(1.8em, weak: true)
  text(size: 12pt, weight: "bold", fill: accent, font: "Gill Sans", it.body)
  v(0.5em, weak: true)
}
#show heading.where(level: 3): it => {
  v(0.9em, weak: true)
  text(size: 10.5pt, weight: "bold", fill: textcol, font: "Gill Sans", it.body)
  v(0.3em, weak: true)
}

#set list(marker: text(fill: accent, weight: "bold")[--], indent: 1.2em, spacing: 0.45em)
#set enum(indent: 1.2em, spacing: 0.45em)

// ── COMPONENTS ────────────────────────────────────────────────────────────────
#let callout(body) = block(
  fill: surface, width: 100%, below: 1.5em, above: 1.5em,
  stroke: (left: 3pt + accent),
  inset: (left: 1.1em, right: 1.1em, top: 0.85em, bottom: 0.85em),
  radius: (right: 2pt),
  text(size: 9.5pt, style: "italic", body)
)

#let sidebar(title, body) = block(
  fill: surface, width: 100%, below: 1.5em, above: 1.5em,
  stroke: (left: 3pt + accent),
  inset: (left: 1.1em, right: 1.1em, top: 0.85em, bottom: 0.85em),
  radius: (right: 2pt),
  {
    text(size: 8.5pt, weight: "bold", fill: accent, font: "Gill Sans", upper(title))
    v(0.4em)
    text(size: 9.5pt, style: "italic", body)
  }
)

#let fig(caption) = {
  v(0.8em)
  block(
    fill: surface, width: 100%, height: 5.5cm,
    stroke: 0.8pt + muted.lighten(40%),
    inset: 0.8em, radius: 3pt, below: 0.5em,
    align(center + horizon, text(size: 8.5pt, fill: muted, style: "italic", caption))
  )
  v(0.4em)
}

#let chapter-opener(num, title, allegory-body) = {
  chapter-state.update(title)
  pagebreak(weak: false)
  v(1.2cm)
  align(right,
    text(size: 76pt, fill: accent.lighten(45%), font: "Gill Sans", weight: "bold", num)
  )
  v(-0.6cm)
  line(length: 100%, stroke: 2pt + accent)
  v(0.9em)
  text(size: 23pt, weight: "bold", fill: textcol, font: "Gill Sans", title)
  v(1.6em)
  block(
    fill: surface, width: 100%,
    stroke: (left: 3pt + accent),
    inset: (left: 1.2em, right: 1.2em, top: 1em, bottom: 1em),
    text(size: 10.5pt, style: "italic", fill: textcol, allegory-body)
  )
  v(2.2em)
}

// Appendix styling
#let appendix-doc(title, subtitle: none) = {
  chapter-state.update("Appendix")
  pagebreak(weak: false)
  line(length: 100%, stroke: 1.5pt + muted)
  v(0.8em)
  align(center, {
    text(size: 14pt, weight: "bold", fill: textcol, font: "Gill Sans", upper(title))
    if subtitle != none {
      v(0.35em)
      text(size: 9pt, fill: muted, style: "italic", subtitle)
    }
  })
  v(0.8em)
  line(length: 100%, stroke: 0.5pt + muted.lighten(30%))
  v(1.5em)
}

#let appendix-section(body) = {
  v(1em)
  text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 1pt, upper(body))
  v(0.25em)
  line(length: 100%, stroke: 0.4pt + muted.lighten(50%))
  v(0.5em)
}

#let key-points(body) = block(
  fill: surface, width: 100%, below: 2em, above: 2em,
  stroke: (left: 3pt + accent),
  inset: (left: 1.2em, right: 1.2em, top: 1em, bottom: 1em),
  radius: (right: 2pt),
  {
    text(size: 8.5pt, weight: "bold", fill: accent, font: "Gill Sans", tracking: 1pt, upper("Key Points"))
    v(0.6em)
    body
  }
)

#let top-tips(body) = block(
  fill: textcol, width: 100%, below: 2em, above: 1.5em,
  inset: (left: 1.3em, right: 1.3em, top: 1.1em, bottom: 1.1em),
  radius: 3pt,
  {
    set text(fill: bg)
    text(size: 8.5pt, weight: "bold", fill: accent.lighten(30%), font: "Gill Sans", tracking: 1pt, upper("Top Tips"))
    v(0.6em)
    set list(marker: text(fill: accent.lighten(30%), weight: "bold")[--], indent: 1.2em, spacing: 0.45em)
    body
  }
)

#let sig-block(party) = block(
  width: 100%, below: 1.5em, above: 1em,
  {
    set text(size: 9.5pt)
    text(weight: "bold", "Signed for and on behalf of " + party + ":")
    v(0.5em)
    grid(
      columns: (2fr, 1fr),
      gutter: 1em,
      {
        text("Signature:  " + " " * 30 + "_")
        linebreak()
        v(0.8em)
        text("Name:  " + " " * 35 + "_")
        linebreak()
        v(0.8em)
        text("Title:  " + " " * 36 + "_")
      },
      {
        text("Date:  " + " " * 20 + "_")
      }
    )
  }
)

// ── TABLE STYLE ───────────────────────────────────────────────────────────────
#let btable(cols, header-cells, ..data-rows) = {
  set text(size: 9pt)
  table(
    columns: cols,
    stroke: none,
    inset: (x: 0.8em, y: 0.55em),
    fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
    ..header-cells.pos().map(c => table.cell(stroke: (bottom: 1pt + accent), strong(c))),
    ..data-rows,
  )
  v(0.5em)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
#set page(numbering: none)

#v(4cm)
#align(right, line(length: 40%, stroke: 3pt + accent))
#v(1.2em)

#align(right, {
  text(size: 32pt, weight: "bold", fill: textcol, font: "Gill Sans",
    "Salient"
  )
  linebreak()
  v(0.3em)
  text(size: 14pt, fill: accent, font: "Gill Sans",
    "Enterprise Selling for STEM Founders"
  )
})

#v(1.5em)
#align(right, line(length: 60%, stroke: 0.6pt + muted))
#v(1em)
#align(right,
  text(size: 11pt, fill: muted, style: "italic",
    "What they don't teach you when you leave the lab"
  )
)

#v(3cm)
#align(right,
  text(size: 10pt, fill: muted, "Sandy McKinnon with Claude")
)

#v(1cm)
#align(right,
  text(size: 9pt, fill: muted, "2026")
)

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════
#pagebreak()
#set page(numbering: none)

#v(2cm)
#text(size: 18pt, weight: "bold", font: "Gill Sans", fill: textcol, "Contents")
#v(0.5em)
#line(length: 100%, stroke: 2pt + accent)
#v(1.5em)

#let toc-entry(num, title, desc) = {
  grid(
    columns: (2.5cm, 1fr),
    gutter: 0em,
    text(size: 9pt, fill: accent, weight: "bold", font: "Gill Sans", num),
    {
      text(size: 10.5pt, weight: "bold", fill: textcol, title)
      linebreak()
      text(size: 9pt, fill: muted, style: "italic", desc)
    }
  )
  v(1.1em)
}

#toc-entry("Intro", "The Commercial Translation Problem",
  "Why the skills that make you good at building don't transfer automatically to selling")
#toc-entry("01", "So You Think You Have a Product",
  "Product definition, value quantification, ICP, pricing, deal structure, gross margin")
#toc-entry("02", "Getting Into the Room",
  "The Economic Buyer, champion dynamics, pain hierarchy, success criteria, next action")
#toc-entry("03", "The Expansion Imperative",
  "Why expansion is a separate sale — and how to plan it before you close the first deal")
#toc-entry("04", "The Qualification Checklist",
  "MEDDPICC as a diagnostic: what you know, what you don't, and what the gaps mean")
#toc-entry("05", "The Late Game",
  "Decision criteria, paper process, competition, and the stoic approach to the final stretch")
#toc-entry("06", "The War Room",
  "Enterprise selling is a team sport — red teaming, shared ownership, and the agent as team member")
#toc-entry("07", "Negotiation",
  "Getting to yes, knowing when to call time, and the art of trading rather than conceding")

#v(0.5em)
#line(length: 30%, stroke: 0.5pt + muted)
#v(0.8em)

#text(size: 9.5pt, weight: "bold", fill: textcol, "Appendix — Starter Documents")
#v(0.4em)
#text(size: 9pt, fill: muted,
  "Mutual NDA · SaaS Licence Agreement · Pilot/POC Agreement · Data Processing Agreement · Commercial Summary · Negotiation Preparation Worksheet"
)

// ═══════════════════════════════════════════════════════════════════════════════
// INTRODUCTION
// ═══════════════════════════════════════════════════════════════════════════════
#pagebreak()
#set page(numbering: "1")
#counter(page).update(1)

#chapter-state.update("Introduction")
#v(2cm)
#text(size: 22pt, weight: "bold", fill: textcol, font: "Gill Sans",
  "Introduction"
)
#v(0.4em)
#text(size: 13pt, fill: accent, font: "Gill Sans",
  "The Commercial Translation Problem"
)
#v(0.5em)
#line(length: 100%, stroke: 1.5pt + accent)
#v(2em)

You built something that works. It solves a real problem. You can demonstrate it, measure it, and explain it to anyone with a technical background. Then you try to sell it, and nothing happens the way you expected.

The buyer says they're interested, then goes quiet. The evaluation drags on for six months. The champion you've been working with leaves the company. The committee requests a proposal and then doesn't respond to it. You get a verbal yes that never turns into a purchase order. You drop the price and close the deal, then wonder why you feel vaguely cheated.

This is the experience of almost every STEM founder who sells their first enterprise deal. It is not bad luck. It is not that the buyer is irrational. It is not that your product needs one more feature. It is that the commercial translation layer between your capability and their purchasing decision is broken --- and you don't know it because nobody told you it exists.

Technology works through precision. Sales works through probability management. These are not the same discipline, and the skills that make you excellent at the first do not transfer automatically to the second. They can be learned. But they have to be learned explicitly, because the failure modes are not what you'd expect.

This book is that translation layer.

It is structured around the concepts in the Salient learning system --- the same framework used in the deal management tool --- because the theory and the practice should reinforce each other. Read a chapter, then go and look at your current deal in that light. The framework is only useful if you use it live, not in retrospect.

A few things this book will not do:

It will not tell you that selling is about relationships and being yourself. That is true in the way that "breathing is important" is true --- it is necessary but not sufficient, and it tells you nothing useful about what to do next Tuesday.

It will not give you scripts. Scripts fail as soon as the buyer says something unexpected, which they always do. What you need is a mental model sturdy enough to navigate unexpected conversations.

It will not pretend that losing deals feels okay. It doesn't, and anyone who tells you it does is either lying or has been selling long enough to have forgotten what it felt like.

What it will do is explain the mechanics. Why deals move and why they stall. Who actually makes the decision and how. What your price signals about your product. How to run the end of a deal so it doesn't fall apart in the last three weeks. And how to build the commercial muscle that most STEM founders only develop after three years of expensive, demoralising trial and error.

Start at Chapter 1. It is about your product. It comes first for a reason.

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 1
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "01",
  "So You Think You Have a Product",
  [_"I have not failed ten thousand times. I have successfully found ten thousand ways that will not work."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Thomas Alva Edison]

  #v(0.6em)
  Thomas Edison did not merely invent things. He invented commercial systems --- the lightbulb only existed within the generating station, the distribution network, the metering, and the customer who understood their gas bill was about to shrink. The allegory for a STEM founder is exact: a working technology without a commercial system is a curiosity, not a product.]
)

#fig("Edison at Menlo Park, surrounded by the accumulated evidence of iteration. The lightbulb on his workbench is not the invention. The invention was the system that made it useful. [Place chapter 1 illustration here]")

== The Edison Problem

Thomas Edison did not invent the lightbulb. Several people had working incandescent lamps before his version. What Edison invented was the commercial electricity system: the generators, the distribution infrastructure, the metering, the wiring standards --- and crucially, the business case. His target customer understood their gas bill. Edison's pitch, in essence, was: this will replace that, and here is the cost per unit of light delivered.

The lightbulb without the generator is a curiosity. The generator without customers who understand that they are buying cheaper light, not buying a machine --- that is also a curiosity. The product was the whole system, and the product's value proposition was legible to the economic buyer in terms they already used.

Most STEM founders build the lightbulb. Then they try to sell it to buyers who don't yet have gas bills --- or don't know what their gas bill is --- or whose gas bill is approved by someone they've never met, in a budget cycle that runs on fiscal calendars the founder hasn't asked about.

Working is not the same as sellable. This chapter is about the gap between them.

== What a Product Actually Is

A product is not a capability. A capability is what your technology can do. A product is the intersection of four things:

+ *A capability* --- what it does
+ *A specific buyer type* --- who experiences the problem it solves
+ *A quantified problem* --- how large the cost is if the problem goes unsolved
+ *An urgency trigger* --- the condition that makes this person buy now rather than later

If you are missing any of these, you do not have a product. You have the components of a product that haven't been assembled yet.

This is not an abstract distinction. It determines whether your first conversation with a prospect has a natural direction or meanders politely to a close. It determines whether you can write a compelling email to someone you've never met, or whether every cold outreach sounds generic and vague. It determines whether your champion can explain your product to their EB without your help, or whether they need you in the room --- which is a fragile position.

The capability you can describe in ten minutes to anyone in your field. The product takes a year of selling to articulate properly. The work of this chapter is to shortcut that year.

== Quantifying Your Value

The single most common failure mode for STEM founders is pitching the capability and skipping the value. "Our system processes 10 million records per second with 99.97% accuracy" is a capability statement. Nobody buys accuracy. They buy what accuracy gives them.

The value equation has four components:

#set text(size: 9pt)
#table(
  columns: (1.8fr, 2fr, 2fr),
  stroke: none,
  inset: (x: 0.7em, y: 0.55em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Value type]),
  table.cell(stroke: (bottom: 1pt + accent), strong[The question it answers]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Example]),
  strong[Cost reduction], [What do they currently pay to do this?], [£400k per year in analyst time],
  strong[Revenue impact], [What revenue does this enable or protect?], [3% improvement in conversion = £2.1M],
  strong[Risk reduction], [What is the cost of the bad outcome this prevents?], [One compliance breach = £1.5M fine],
  strong[Time to value], [How much faster does this deliver an outcome?], [From 6 weeks to 3 days per project],
)
#set text(size: 10.5pt)

You need at least one of these to be quantified --- not estimated, not directional, but a number the buyer can put in a spreadsheet. Ideally you get to more than one. The number does not need to be exact. It needs to be defensible and specific enough that it is harder to argue against than to accept.

The instinct of STEM founders is to be precise about technical claims and vague about commercial claims. This is the opposite of what the buyer needs. They will never check your uptime SLA themselves. They will immediately stress-test the business case.

Here is the practical exercise. Take the problem your product solves and ask: if a company had this problem and did not fix it for one year, what would it cost them? Now ask: what type of person at that company is held accountable for that cost? That person is your buyer. What they feel about that cost --- the anxiety, the frustration, the quarterly review conversation --- is the emotional signal you are selling to.

#callout[*Note:* The number you use in the business case does not need to come from your own analysis. It is better to get it from the customer. Ask them: "What's the current cost of dealing with this?" They will almost always have a number. That number, coming from them, is more credible in their internal approval process than any number you could offer.]

== Defining Your Ideal Customer Profile

An ICP is not a market segment. "Financial services firms with over 500 employees" is a market segment. Your ICP is a specific type of person, in a specific type of company, at a specific moment when they are likely to buy.

The moment is the critical part that founders miss.

An ICP has four layers:

+ *Company characteristics* --- size, sector, tech stack, regulatory environment
+ *Buyer role* --- the title, the function, the level of seniority
+ *Problem state* --- the specific condition that makes this problem acute for them right now
+ *Trigger event* --- the thing that happened recently to make them willing to act

The trigger event is what converts a prospect into an active buyer. Without a trigger, they are interested but not buying. With a trigger, they have urgency. Common triggers include: a new regulatory requirement, a recent public incident, a change in leadership, a failed audit, a competitor doing something they can't match, a technology they just decommissioned that leaves a gap.

Your job in prospecting is not to find people who might be interested. It is to find people who have just had the trigger event. That is a much more tractable search.

One way to identify your trigger is to look at your existing best customers and ask: what happened in the three months before they first contacted you? The pattern across two or three answers is usually your ICP trigger.

== The Status Quo Is Your Real Competitor

Before you can sell against a named competitor, you have to sell against doing nothing. "Doing nothing" is the most common outcome of any enterprise evaluation. Not choosing a different vendor --- just not deciding at all.

The status quo has powerful advocates inside every enterprise. The team that built the existing process has sunk cost invested in it. The people who use it have muscle memory. The manager who approved it three years ago has reputational equity. None of these people are your enemies --- but none of them will volunteer to make your case.

The status quo also has one key advantage over any challenger: it is known. Its costs are invisible because they are baked into operating assumptions. Your product introduces change, which has visible costs (time, disruption, retraining, risk of failure) even when the financial case for change is clear.

To compete with the status quo, you need to make its costs visible. This is different from attacking it. You are not saying their current approach is wrong. You are helping them quantify what they are already paying, so that the comparison with your solution is a calculation rather than a preference.

The question that surfaces this is not "what's wrong with what you're doing today?" --- that puts them on the defensive. The question is "what does it cost you when this goes wrong?" or "how do you currently handle [the thing your product does]?" Listen for the process. The inefficiency is usually audible in the description.

#sidebar("Archimedes and the lever",
  [Archimedes said: "Give me a lever long enough and a fulcrum on which to place it, and I shall move the world." The lever is your product. The fulcrum is the buyer's pain. Without the fulcrum --- a solid, specific problem that is costing them something real --- the lever has nothing to push against. Every sales conversation that doesn't start with establishing the pain is a lever with no fulcrum. You are exerting force against nothing.]
)

== Value-Based Pricing

Most technical founders price by reference to cost: what it costs to build, host, and support, plus a margin that feels reasonable. This is the wrong starting point, and it produces prices that are consistently too low.

The correct starting point is value: what is the problem worth to the buyer?

If your product saves a company £400k per year in analyst time, and you charge £40k per year, you have priced at 10% of value. That is a reasonable ratio for a first deal --- you are new, unproven, and the customer is taking a risk. But if you had priced at £20k because your costs are £10k and you wanted a 100% margin, you have left £20k per customer per year on the table, and you have set an anchor that will be very difficult to move.

The other reason cost-based pricing is dangerous is that it communicates something to the buyer. Enterprise buyers are sophisticated. A very low price triggers the question: what are they missing? Is the vendor not confident in the value? Are there hidden costs? Is this a startup that might not be around in two years?

Price signals quality, stability, and confidence. A price that is too low for the problem you are solving raises more questions than it answers.

#sidebar("Elon Musk and first principles",
  [Musk's much-discussed "first principles" approach is directly applicable to pricing. Convention says: look at what competitors charge and price relative to that. First principles says: what is the raw value this creates, and what fraction of that value is a fair price to charge? These two methods often produce very different numbers. Conventional pricing anchors you to a market that may itself be mispriced. First principles forces you to defend your number in terms of value, which is exactly the conversation you want to have with a sophisticated buyer.]
)

== What Your Price Signals

Pricing is a form of communication. It tells the buyer several things simultaneously, and you should be intentional about what you want it to say.

A high price relative to peers signals: this is a premium product, the vendor is confident in the value, this is not a commodity. It attracts buyers who are solving expensive problems and can tolerate the cost.

A low price signals: accessible, low risk, easy to try --- or: unproven, struggling for revenue, not sure of the value. Buyers who are risk-averse or budget-constrained respond well to low pricing. Buyers who are trying to solve a £5M problem are suspicious of a £20k solution.

Price also affects the approval path. In most enterprises, there are informal thresholds below which a department head can approve without procurement involvement, without a formal tendering process, and often without legal review. These thresholds vary by organisation but are typically around £10k, £25k, and £75k annually. A deal priced just above a threshold is in a different approval process than one just below it.

This means that pricing a deal at £24k when the value is £100k is not just about leaving money on the table --- it also means you will be approved by a different person than the one who controls the budget at the relevant scale. Deliberately pricing below a threshold to avoid procurement is a short-term tactic that often creates longer-term problems.

== Deal Structure: ACV, TCV, and NRE

The structure of a deal --- not just the price --- affects how it gets approved, who approves it, and how the buyer accounts for it.

*ACV (Annual Contract Value)* is the annualised recurring value of the contract. This is the number most relevant for SaaS deals. A three-year deal worth £150k total has an ACV of £50k.

*TCV (Total Contract Value)* is the full value over the contract term. A three-year £150k deal has a TCV of £150k. TCV matters when you are trying to get a large number approved in a single signature --- it is often easier to get a £150k three-year deal through than three sequential £50k annual deals, because the approval process is the same but you get the commercial certainty.

*NRE (Non-Recurring Engineering)* is one-off implementation or customisation cost. It sits outside the recurring ACV and is accounted for differently (often as capex rather than opex).

#set text(size: 9pt)
#table(
  columns: (1.6fr, 1.5fr, 1.5fr, 1.8fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Structure]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Approval level]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Accounting]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Best used when]),
  strong[Annual ACV <£25k], [Department head], [Operating expense], [Early deals, fast close],
  strong[Annual ACV £25--100k], [VP / Director], [Operating expense], [Established relationships],
  strong[Multi-year TCV >£100k], [CFO / Board], [Mixed], [High confidence, mature product],
  strong[NRE element], [Capital budget], [Capex], [Custom integration required],
)
#set text(size: 10.5pt)

Deal structure is not just a commercial decision --- it is a sales strategy decision. Understand who needs to approve your deal before you write the proposal, and structure accordingly.

== Gross Margin Benchmarks

Margin is a signal of business health to investors, and a signal of value delivery to customers. Knowing the norms for your category helps you price defensibly.

#set text(size: 9pt)
#table(
  columns: (2fr, 1.5fr, 2fr),
  stroke: none,
  inset: (x: 0.7em, y: 0.55em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Business type]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Gross margin]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Key driver]),
  strong[Pure SaaS], [75--85%], [Near-zero marginal cost per customer],
  strong[AI / inference-heavy SaaS], [60--75%], [GPU and inference costs reduce margin],
  strong[Services-led / implementation], [35--55%], [Labour-intensive delivery],
  strong[Hardware product], [40--60%], [COGS-heavy; defend with software margin],
  strong[Hardware + software platform], [65--80% blended], [Hardware at lower margin; software at high],
)
#set text(size: 10.5pt)

For a STEM startup, gross margin is often lower in the early years because of manual delivery, customer success overhead, and infrastructure that isn't yet optimised. This is normal, but you should know your current gross margin per customer and have a credible path to the category benchmark.

The reason this matters for sales: buyers at enterprise scale sometimes ask about your financial position. Investors certainly do. A business with 40% gross margin in a pure SaaS category is either underpriced, over-serviced, or has cost structure problems --- and sophisticated counterparties will notice.

== The Annual Plan: Working Backwards from the Number

#fig("[Figure: Sisyphus on the mountain — the Sisyphean nature of outbound enterprise selling without a plan]")

Sisyphus was condemned to roll a boulder up a hill for eternity. Each time he neared the summit, it rolled back down. Most enterprise sales teams operate this way: chasing individual deals, celebrating closures, then looking up to find the pipeline empty and starting again. The plan is the mechanism by which you stop being Sisyphus.

Enterprise sales is almost never market updraft. The founders who have experienced it --- a product that spreads virally through an organisation, inbound demand that outpaces capacity --- are rare. The overwhelming majority of B2B enterprise selling is outbound, high-touch, and Sisyphean by default. The plan does not remove the effort. It makes the effort productive rather than circular.

=== Working Backwards from Revenue

Start with the number your company needs to hit. Then work backwards:

*Annual recurring revenue target:* e.g. £1.5M ARR new business

*Average ACV:* e.g. £120k

*Required new logos:* £1.5M ÷ £120k = ~13 new customers

*Win rate (qualified pipeline to closed):* e.g. 25%

*Required qualified pipeline:* 13 ÷ 0.25 = 52 qualified opportunities

*Pipeline conversion (leads to qualified):* e.g. 20%

*Required leads into process:* 52 ÷ 0.20 = 260 initial conversations

*Average sales cycle:* e.g. 7 months

This means 260 initial conversations need to enter the process across the year --- roughly 22 per month --- and the pipeline you are working now will close in Q3 and Q4. The Q1 target is not closed from Q1 pipeline. It is closed from pipeline that was built in Q2 and Q3 of the prior year.

Most STEM founders treat this maths as abstract. The ones who operate to plan treat it as a weekly operational dashboard.

=== ACV Threshold: When High-Touch Is Viable

High-touch outbound enterprise sales has a minimum viable price point. Below it, the economics of selling outpace the economics of the product.

#set text(size: 9pt)
#table(
  columns: (2fr, 1.5fr, 2.5fr),
  stroke: none,
  inset: (x: 0.7em, y: 0.55em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[ACV range]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Motion]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Rationale]),
  strong[< £15k], [PLG or self-serve only], [CAC economics impossible at this price with sales involvement],
  strong[£15k -- £50k], [Low-touch inside sales], [Short cycle possible; limited in-person investment],
  strong[£50k -- £150k], [High-touch outbound], [Viable with efficient process; founder-led initially],
  strong[£150k -- £500k], [Enterprise / strategic], [Multi-stakeholder; 6-12 month cycle; exec sponsorship required],
  strong[> £500k], [Strategic accounts], [Board-level relationships; long-cycle; dedicated AE],
)
#set text(size: 10.5pt)

Agentic sales tools (including Salient) are beginning to compress the bottom of this range. A founder who can run five structured coaching sessions simultaneously, with AI handling preparation and debrief, may extend the viable threshold down to £30--40k. But the fundamental economics do not disappear: every enterprise deal requires human judgement, executive relationships, and a paper process. The question is how much time each of those takes.

The practical implication: if your current ACV is below the viable threshold for your chosen motion, either raise prices or redesign the sales model. Outbound enterprise sales at £20k ACV does not work without a very short cycle, a very high win rate, or an unusually low cost of sale. Build the plan first, then check whether the motion and the price point are coherent.

#key-points([
  - Product truth is about commercial system design, not technical capability
  - Quantify value in the unit your buyer measures: money saved, revenue enabled, risk reduced
  - Know your ICP precisely — not every company with a need is a customer worth pursuing
  - Price on value delivered, not cost plus margin; price anchoring reveals what buyers already spend
  - High-touch outbound enterprise sales requires ACV ≥ £50--100k to be economically viable
  - Build the annual plan by working backwards from revenue, through win rate, to required pipeline cadence
  - Know your gross margin per customer and your path to the category benchmark
])

#top-tips([
  - Write your value statement in one sentence: "[Product] helps [ICP title] at [ICP company type] [verb] [measurable outcome] by [mechanism]." If you cannot complete this sentence, you are not ready to sell.
  - If you cannot answer "what does a bad month cost your customer without this?", you do not yet have a commercial case.
  - Run one structured pricing conversation per week until you have three data points from real buyers — then you have a pricing position, not an assumption.
  - Build the annual plan in the first two weeks of each year: revenue target → required logos → required pipeline → required cadence. Put it on one page. Review it monthly.
  - If your ACV is below the viable threshold, do not add salespeople. Fix the price or redesign the motion first.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 2
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "02",
  "Getting Into the Room",
  [_"Persuasion is achieved by the speaker's personal character when the speech is so spoken as to make us think him credible... by the hearers, when the speech stirs their emotions... by the speech itself, when we have proved a truth or an apparent truth by means of the persuasive arguments suitable to the case."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Aristotle, _Rhetoric_]

  #v(0.6em)
  Aristotle identified three modes of persuasion: Ethos (credibility), Pathos (emotion), Logos (logic). STEM founders arrive with Logos. The work of this chapter is to build Ethos and engage Pathos --- and to do this with the person who actually controls the decision.]
)

#fig("Aristotle in the Lyceum, surrounded by students who have not yet been asked to buy anything. The three modes of persuasion are visible in every effective sales conversation. [Place chapter 2 illustration here]")

== Three Modes of Persuasion

Aristotle identified three ways to persuade: Ethos (credibility --- who you are), Pathos (emotion --- what they feel), and Logos (logic --- the argument itself). He was describing political rhetoric in fourth-century Athens, but the framework maps directly onto the enterprise sales conversation.

Founders arrive with Logos. They have the technical proof, the benchmarks, the ROI calculation, the case study. The argument is sound. The numbers are right.

What they often lack is Ethos --- the credibility that comes from the buyer's trust in the person making the argument, not just the argument itself. If the buyer has never heard of you, has no reference from a peer they trust, and can't verify your claims without significant effort, the Logos is largely irrelevant. They will not act on a credible argument from an unknown source.

And Pathos --- the emotional connection to the problem --- is what creates urgency. It is not manipulation. It is the recognition that the buyer is a person who feels the pain of the problem, who worries about the things that can go wrong, who wants to be the person who solved this. If you engage only at the intellectual level, you get intellectual responses: thoughtful questions, considered scepticism, and requests for more information. To create a decision, you need to connect to what the buyer actually cares about.

Most STEM founders lead with technical proof, which addresses Logos. The work of this chapter is to build Ethos and engage Pathos --- and to do this with the person who actually controls the decision.

== The Economic Buyer

The Economic Buyer (EB) is the person who has budget authority, is held accountable for the outcome, and has final word on whether to proceed.

All three criteria must be present. The person who has budget but no accountability for the outcome is a sponsor, not the EB. The person who is accountable for the outcome but must get financial approval from above is not the EB. The person who has the final operational say but reports to someone who still needs to approve the cost is not the EB.

In a small company, the EB is usually obvious --- it is the CEO or the CFO or the founder. In a large enterprise, the EB is often obscured. The person you are talking to may genuinely believe they are the EB. They may be trying to protect their turf. They may simply not know who actually controls the budget this year after the reorganisation.

The three characteristics of an EB:

+ *Budget authority:* They can commit the money without additional approval. Not "I'll put it in the plan" --- they can sign the PO.
+ *Accountability:* The success or failure of this initiative is on their performance review. They will be asked about it.
+ *Final word:* When the internal conversation is over, their view determines the outcome.

Why does this matter so much? Because if you are selling to someone who is not the EB, you are building a proposal that will eventually be reviewed and summarised by someone else for someone else --- who has not heard your pitch, has not been through the discovery conversation, and will make their judgement from a written summary that the person you've been talking to may not be able to write compellingly.

== Why Founders Avoid the EB

There are legitimate reasons to not start with the EB. If you have no relationship, no credibility, and no warm introduction, cold outreach to a C-suite buyer often fails. The normal entry point is the technical champion or the operational manager --- someone who feels the problem directly and is willing to evaluate the solution.

The error is not starting there. The error is staying there.

Founders avoid escalating to the EB because:

- They fear being rejected by someone senior before the product has been fully evaluated
- They have built a good relationship with the champion and don't want to disrupt it
- They assume the champion will make the case when the time comes
- They don't know how to get an EB meeting without it feeling like a power move

The cost of this avoidance is that deals stall. The champion finishes their evaluation, produces a recommendation, and then nothing. Because the EB has not been in the conversation, they were not involved in defining the success criteria, they have not developed trust in the vendor, and they are now being asked to approve a budget based on someone else's summary. This is exactly the moment when "we need to pause and evaluate some other options" happens.

The champion is not the buyer. They are your advocate inside the building. You need both.

== Getting to the EB Through the Champion

The right moment to push for EB access is after the champion's conviction is established but before the formal evaluation is complete. You want the champion on your side before you ask them to arrange the introduction --- but you do not want to wait until the evaluation is over, because then the EB is being asked to rubber-stamp a decision rather than participate in one.

How to ask the champion:

#callout["We've done good work establishing what this could mean for your team. The next step that would make a real difference is getting ten minutes with [CFO/COO/whoever] --- not to pitch them, but to understand what they need to see to be comfortable. Would you be willing to make that introduction?"]

Notice what this is not: it is not "I need to escalate." It is not "your boss needs to hear this." It is framing the EB meeting as intelligence-gathering --- understanding what the EB needs --- rather than as a sales move. This is accurate. The EB meeting is primarily about discovery, not about presenting.

If the champion refuses to arrange the introduction, this is a diagnostic signal. Either they don't have the access they implied, or they are not confident enough in your product to put their credibility on the line, or the deal is less advanced than you thought. None of these are reasons to continue investing at the same level.

== Meeting the EB: Not a Pitch, a Briefing

When you get the meeting with the EB, do not bring a deck. Bring three questions.

The EB's time is scarce. They have been in too many vendor pitches. What they respond to is directness, efficiency, and the recognition that you understand their level of concern --- which is different from their team's level of concern.

The three questions for an EB meeting:

+ *"What does success look like for you personally from this initiative?"* Not for the team. For them. The EB is accountable. They have a view on what outcome makes the investment worthwhile.

+ *"What's the biggest risk you'd need to see managed before you're comfortable moving forward?"* This surfaces the objection they haven't stated. EB objections are usually about risk (to the business, to their reputation) rather than about features or price.

+ *"What would need to be true for this to be approved in [timeframe]?"* This is a direct question about the decision process. A confident EB will answer it. An uncertain one will reveal that they don't fully control it.

Your job in this meeting is to listen, not to present. You are gathering the information you need to win. The EB is telling you what they need to say yes --- which may be different from what the champion thinks they need.

== Identified Pain

Pain has a hierarchy. At the top is business pain: the thing that costs the organisation money, creates risk, or prevents them from achieving a strategic goal. At the bottom is technical pain: the thing that causes operational frustration --- slow systems, manual processes, poor tooling.

You need both, but in the right order. Technical pain is what the champion feels. Business pain is what the EB cares about. A deal that is only articulated in terms of technical pain will stall at the EB, because the EB's job is to allocate budget to business problems.

The translation from technical to business pain is the critical step, and it is the one most founders skip or do badly.

*Technical pain (champion):* Our data pipeline takes 6 hours to run and requires manual intervention when it fails.

*Business pain (EB):* The delay in processing means our weekly trading report is two days old by the time decisions are made on it, which has cost us three incorrect positions in the last year. We've estimated this at around £800k in avoidable losses.

The business pain statement is not invented by the vendor. It is developed in conversation with the champion, using their numbers and their language. The founder's job is to help the champion translate their operational frustration into a business case that the EB will act on.

One more thing about pain: it must be confirmed by the EB, not assumed. You may hear the pain clearly from the champion. The EB may not share it --- they may have different priorities, a different budget cycle, or a different definition of what constitutes a problem worth fixing. Until the EB has acknowledged the pain in their own words, it is not established.

#callout[*Note:* The most dangerous position in a deal is having a champion who understands the pain perfectly and an EB who has never been asked about it. You can run a complete evaluation, build a compelling proposal, and hit a wall in the final week when the EB says "we've decided to handle this internally for now."]

== Success Criteria

Success criteria are the definition of what good looks like --- the specific, measurable outcomes that will constitute a win for the evaluation. They matter because:

+ They give the evaluation a defined end point, rather than drifting indefinitely
+ They give the champion something concrete to present to the EB
+ They give you a basis for demonstrating value during a pilot or proof of concept
+ They make the decision binary: you either meet them or you don't

The error is to allow success criteria to remain vague. "We'd like to see that it works with our data" is not a success criterion. "We'd like to see it process our full quarterly data set with 99.5% accuracy and produce the output report in under 4 hours" is a success criterion.

The establishment of success criteria is also the moment when you learn whether the deal is real. A prospect who refuses to define what success looks like --- who says "we'll know it when we see it" --- is not ready to buy. A real evaluation with a real budget and a real timeline will have concrete success criteria, because the internal approval process demands them.

Push for precision: "If we met all of these criteria at the end of the pilot, would you be in a position to move forward? What else would need to be true?"

== The Next Action

The next action is the most consistently underused tool in enterprise sales. Every conversation ends with something, but not every ending is equal.

A real next action has three components:

+ *Specificity* --- what exactly is happening
+ *Ownership* --- who is doing it (them or you)
+ *Date* --- when it will be done, not when it might happen

"I'll send you some information and we can talk after you've had a chance to review" is not a next action. It is an excuse to end the conversation without commitment.

"I'll send you the data sheet by Thursday. Can you have a look and we'll speak the following Tuesday at 2pm to go through your questions?" is a next action.

The next action should also be linked to the buying process --- it should move the deal forward, not just keep the relationship alive. "Let's have another call to stay in touch" is a next action that serves the vendor, not the deal. "I'll connect you with our CTO for a technical deep dive before you finalise the evaluation criteria" is a next action that serves the deal.

A deal without a live, agreed next action is not a deal. It is a conversation that has paused.

#sidebar("Sun Tzu and Alexander",
  [Sun Tzu wrote: "Every battle is won before it is fought." In the context of an EB meeting, this means: you should know before you walk in who the EB is, what they care about, what the objections are likely to be, and what a successful outcome looks like. The champion is your intelligence source. A meeting for which you are not prepared is a meeting you have already lost.

  Alexander the Great never fought through proxies where he could fight directly. He made personal contact with opposing generals, decision-makers, and city leaders rather than sending intermediaries. In modern sales: the founder who meets the EB personally will almost always outsell the one who sends a sales rep or relies on a champion to carry the message.]
)

#key-points([
  - Getting the EB meeting is a milestone; arriving unprepared to it is a waste of the milestone
  - Your champion is your intelligence source — invest in the relationship proportionally to the deal size
  - Ethos (credibility) and Pathos (consequence) matter as much as Logos (logic) in an EB conversation
  - The next action must be agreed in the meeting, owned by a named person, and dated
  - Know the decision process before you pitch — who approves, in what sequence, on what criteria
  - A deal without a live, agreed next action is a conversation that has paused, not a deal
])

#top-tips([
  - Never leave a meeting without a live next action with a date. If you cannot agree one, the deal has a problem.
  - Spend 30 minutes before any EB meeting on preparation: who they are, what their stated priorities are, what the likely objections are, and what a successful outcome looks like.
  - Ask the champion before the meeting: "If this doesn't happen, what is the cost to you personally?" The answer tells you how hard they will fight.
  - After every call, email a one-line summary: "Thanks for the time --- we agreed [X] by [date]. I'll send [Y] by [date]." This is your paper trail and your accountability mechanism.
  - If the champion cannot get you a meeting with the EB, ask why. The answer is often the most important data point in the deal.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 3
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "03",
  "The Expansion Imperative",
  [_"The man who starts out simply with the idea of getting rich won't succeed; you must have a larger ambition."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- John D. Rockefeller]

  #v(0.6em)
  Rockefeller built Standard Oil not by selling a lot of oil, but by controlling every point at which oil moved. Each position he acquired was leverage for the next. He never celebrated a deal; he planned the next one from inside the first one. The first enterprise close is a beachhead. The question is what you build from it.]
)

#fig("The Standard Oil pipeline network by 1882. Each line represents a deal Rockefeller had already planned before the preceding deal was closed. The beachhead was never the destination. [Place chapter 3 illustration here]")

== The Beachhead Is Not the Business

Rockefeller did not build Standard Oil by selling a lot of oil. He built it by controlling every point at which oil moved --- the refineries, yes, but also the pipelines, the rail freight arrangements, the storage facilities, the retail distribution network. Each position he acquired was leverage for the next.

His genius was not the first deal. His genius was seeing, from within the first deal, exactly where the next leverage point was and moving towards it while the ink was still wet on the current agreement.

Most founders celebrate the first enterprise close. This is understandable. The first enterprise close is hard. But the celebration should be brief, because what you have at that moment is a beachhead, not a business. A single enterprise customer who churns at renewal is not a business. A pattern of enterprise customers who expand, who refer, and who become the reference point for the next deal --- that is a business.

Expansion is not a product problem. It is a sales problem. And it is a problem you must start solving before you close the first deal.

== Why Expansion Is a Separate Sale

The most common mistake founders make after a successful first deployment is assuming that good results will automatically lead to expansion. They do not.

Expansion is a separate sale because:

- The expansion buyer is often different from the initial buyer. The first deal may have been approved by a department head. The expansion to the next three departments needs the COO or CFO.
- The business case is different. The first deal was evaluated on its merits for the specific problem it solved. The expansion needs a business case for the larger investment, often at a different return threshold.
- The internal competition for budget at expansion scale is different. You are no longer competing against "do nothing." You are competing against every other initiative that has already proven itself and is also asking for more budget.
- The buying process is longer. A £20k initial deal may have had a short approval process. A £200k expansion will not.

This is counterintuitive. The customer already uses your product. They have evidence that it works. Surely the second deal is easier than the first?

In some cases it is easier --- but the sales process is not shorter, the buyer is not more relaxed, and the budget still has to come from somewhere. The founder who assumes the expansion will happen naturally will be surprised by how much work it requires.

== Why Expansion Stalls

Three things cause expansion to stall, and they are almost always present simultaneously:

*Wrong EB.* The expansion requires a budget holder you have not met. The original EB's budget can approve the initial deal but not the expansion, and the higher EB has heard about your product only secondhand.

*No business case.* The first deal's success was demonstrated operationally --- the team uses it, they like it, it works. But nobody has built the commercial case for what the next phase is worth. "It's working well" is not a business case for doubling the investment.

*Nobody owns it.* The internal champion who drove the first deal is often not the right person to drive the expansion. They have delivered their project; now they move to the next priority. Unless someone inside the customer organisation is accountable for the expansion, it will drift indefinitely.

The solution to all three is to have the expansion conversation before you close the initial deal --- while the buyer's excitement is high and the deal is live.

== The Three Questions to Answer at Close

Before you close the first deal, you need answers to three questions. These are not post-sale questions. They are part of the negotiation.

=== 1. What does 10× look like?

What would it mean if this deployment worked perfectly and the customer decided to extend it across the full organisation? What departments? What use cases? What would the commercial value be? This conversation does two things: it gets the customer thinking expansively (which builds ambition), and it gives you the intelligence you need to plan the expansion sale.

=== 2. Who signs it?

If the expansion deal is three times the size of the initial deal, who needs to approve it? Is it still the same EB, or does it need to go to someone more senior? If it needs to go to someone more senior, have you met them?

=== 3. Have we met them?

This is the most important question, and the most often ignored. If the expansion requires a CFO who has never heard of you, you have a relationship gap that will cost you months. The time to close that gap is during the initial implementation, when you are in the building, when your champion has credibility, and when the success story is fresh.

== The Expansion EB

The expansion EB is the person who controls the budget at the scale of the expanded deal. They are not always more senior than the initial EB --- it depends on the organisation --- but they are almost always different.

How to identify them: Ask your champion. "If this goes brilliantly and we want to roll it out to the whole organisation next year --- who makes that call?" Most champions know the answer. They will either name the person directly or describe the process.

How to get introduced during the pilot: Frame the introduction as a progress briefing. "We're four weeks into the pilot and the early results are good. It would be valuable to give [name] a brief update --- not a sales conversation, just a five-minute heads up on where things stand." Executives generally appreciate being kept informed. A champion who won't arrange this introduction either doesn't have the relationship or isn't confident enough in the results.

What to say when you meet them: Don't sell. Update. "The pilot is going well. We've seen [specific outcome] in the first month. Our hypothesis is that if this extends to [other departments], the total impact would be [specific number]. We'd want to do that in a way that makes sense for you --- what would you need to see before that conversation makes sense?"

== The 30/60/90 Day Check-in as Sales Infrastructure

Most founders do customer success check-ins because they care about the customer's success. This is admirable. But the 30/60/90 day check-in should also be understood as the expansion sales process in disguise.

*30-day check-in:* Operational success. Is the integration working? Are the users using it? Is there any friction that needs to be resolved? The agenda is health, but the intelligence you are gathering is: which teams would benefit from this? Who has expressed interest? Are there adjacent problems visible?

*60-day check-in:* Business outcomes. Do you have preliminary data on the value being delivered? Can you start to build the business case for expansion? This is the moment to have the "what does success look like at scale?" conversation, because there is now real data to anchor it.

*90-day check-in:* Expansion readiness. At this point, if the pilot is working, you should be having an explicit conversation about what comes next. Who is the right EB for that conversation? What does the timeline look like? What would need to be true for the expansion to be approved in the next quarter?

The check-in is not a checkpoint. It is a meeting with a sales objective --- even when the nominal objective is customer success. Both can be true simultaneously.

#sidebar("Caesar and Darwin",
  [Julius Caesar's Gallic Wars were not a series of independent conquests. Each victory created the logistical and political position for the next. The supply lines he established across Gaul were not just military infrastructure --- they were the mechanism by which Roman governance replaced military occupation. He was building permanent presence from within temporary success.

  Darwin's observation that species which adapt to new environments survive --- while those which over-specialise in a single niche are vulnerable --- applies directly to the founder who closes one enterprise deal and builds the entire company around that one customer's requirements. Diversify the customer base. Build product capabilities that serve the expansion EB, not just the initial buyer. The beachhead is not the destination.]
)

#key-points([
  - The first enterprise close is a beachhead, not a destination; start planning expansion from day one
  - Land with one team that has an acute, quantifiable problem; expand to adjacent teams with adjacent problems
  - Value delivered in the pilot is your best case for expansion — instrument it from the start
  - Expansion economics are dramatically better than new logo economics: no new trust to build, shorter cycle, higher win rate
  - The check-in is not just customer success — it is a sales meeting with a customer success framing
  - Identify your expansion champion in the first 30 days; they may be different from your initial champion
])

#top-tips([
  - Start the expansion conversation at the 60-day check-in, not at renewal time. By renewal, it should already be agreed.
  - Build a success metric into the pilot contract that you know you can hit, and that the expansion EB will care about.
  - At the 30-day check-in ask: "Which other teams have asked you about this?" The answer is your expansion pipeline.
  - Do not wait to be invited to the expansion meeting. Propose the agenda and the attendees. Own the next step.
  - If you cannot name the expansion champion by day 45, you are behind. Make finding them an explicit action.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 4
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "04",
  "The Qualification Checklist",
  [_"When you have eliminated all which is impossible, then whatever remains, however improbable, must be the truth."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Sherlock Holmes, _The Adventure of the Blanched Soldier_]

  #v(0.6em)
  Holmes was not gifted with supernatural perception. He was disciplined. He observed what others overlooked, recorded what others dismissed, and built inference chains where others accepted surface impressions. MEDDPICC is the detective's table: what you know, what you don't know, and what the gap between them tells you about the state of the deal.]
)

#fig("Holmes with the evidence arranged. Every item on the table is a known. The diagnosis follows from the knowns, not from instinct. [Place chapter 4 illustration here]")

== The Detective's Method

Holmes was not gifted with supernatural perception. He was disciplined. He observed what others overlooked, recorded what others dismissed, and built inference chains where others accepted surface impressions. "Gut feel" is the Watson method. Systematic observation is the Holmes method.

When a founder says "I think this deal is going well," they are Watson. They are feeling the deal rather than knowing it. The deal feels warm because the champion is enthusiastic, the conversations are productive, the demo went well. These are positive signals, but they are not evidence of a deal.

MEDDPICC is the detective's table. It is a framework for making the state of a deal explicit, so that you are working from knowledge rather than impression. A deal in which every MEDDPICC element is green is not a guaranteed close --- but a deal in which several elements are red or unknown is not closing next month, no matter how good the conversations feel.

== MEDDPICC: A Diagnostic, Not a Checklist

MEDDPICC stands for: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identified Pain, Champion, Competition.

The common mistake is to treat it as a checklist --- a set of boxes to tick before a deal can be called qualified. This is not how it works.

MEDDPICC is a diagnostic. It tells you what you know and what you don't know about a deal. The gaps are the work. A deal with a weak Champion is not disqualified --- it is a deal where your next priority is to either develop the champion or find a better one. A deal with no confirmed Metrics is not lost --- it is a deal where the next conversation should be about the business case.

The insight is that you can predict, with reasonable accuracy, which deals will close based on the state of the MEDDPICC elements --- not because the framework is magic, but because the elements it measures are genuinely the things that determine whether a complex sale completes.

#set text(size: 9pt)
#table(
  columns: (1cm, 2fr, 2fr, 2fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Element]),
  table.cell(stroke: (bottom: 1pt + accent), strong[What it measures]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Key failure mode]),
  strong[M], [Metrics], [Quantified business case], [Value is directional, not specific],
  strong[E], [Economic Buyer], [Decision authority], [Talking to the wrong person],
  strong[D], [Decision Criteria], [Formal evaluation requirements], [Criteria set by competitor],
  strong[D], [Decision Process], [How the decision is made], [Process is longer than assumed],
  strong[P], [Paper Process], [Legal and procurement steps], [Paper process starts too late],
  strong[I], [Identified Pain], [Confirmed business problem], [Pain is technical, not business-level],
  strong[C], [Champion], [Internal advocate], [Champion has no power to act],
  strong[C], [Competition], [Who else is in the evaluation], [Competitive threat not mapped],
)
#set text(size: 10.5pt)

== Metrics: The Language the EB Speaks

Metrics are the quantified business case --- the numbers that justify the investment. Without them, your deal lives or dies on the subjective judgement of whoever approves the budget, which is a fragile position.

Metrics come in two types:

*Hard metrics* are directly measurable and easily attributed to the product. Time saved, error rates reduced, headcount avoided, revenue directly generated by the tool. These are the strongest metrics because they are auditable.

*Soft metrics* are real but harder to measure precisely. Improved decision quality, faster time to insight, better employee satisfaction, reduced risk of an unlikely-but-costly event. These are not fabricated, but they require more work to quantify and more credibility to land with a sceptical CFO.

The standard you should aim for: metrics that the buyer has provided or validated, expressed in their terminology, and sufficient to justify the ACV with a clear return calculation.

Weak metrics look like:

- "We believe this will improve efficiency significantly"
- "Companies using this typically see 20--40% improvement" (generic benchmark, not their number)
- "The team will save a lot of time" (not quantified)

Strong metrics look like:

#callout["Based on your current process, we estimate 4 hours per analyst per week --- that's 800 hours per year across your team, which at fully-loaded cost is approximately £120k. The product costs £40k. The payback period is four months."]

The number should be theirs. The calculation can be yours. The combination is a business case.

== Champion: The Internal Advocate

Your champion is not the person who is friendliest to you. They are not the person who has evaluated the product most thoroughly. They are not the person who has been most positive in your conversations.

Your champion is the person inside the customer organisation who is actively using their own credibility and political capital to advance your deal.

This is a specific, behavioural definition. The champion acts. They arrange meetings you didn't ask for. They surface information about internal dynamics. They tell you when something has changed. They protect your deal when procurement tries to delay it. They push back on competing internal priorities.

If your "champion" has never done any of these things, they are a user, or a sponsor, or a friendly contact. They are not a champion.

The four tests of a real champion:

+ *They have arranged a meeting with someone senior that you didn't explicitly request.* They are putting their own credibility on the line to advance the deal.
+ *They have told you something you wouldn't otherwise know.* Internal politics, competing priorities, the real reason for a delay. A real champion gives you intelligence.
+ *They can tell you what the EB thinks.* Not what they assume the EB thinks. What they have heard the EB say.
+ *They have a reason to personally succeed.* The champion's success is tied to this deal succeeding. They have something at stake.

A champion who fails any of these tests should be assessed carefully before you invest further in the deal. Many deals that feel progressing are actually stalled at the champion stage --- a friendly but powerless contact who cannot move anything.

== What Weakens a Champion

Champions weaken in predictable ways:

*They change roles.* Reorganisations happen. The champion you built over six months moves to a different division. Their replacement has no relationship with you and no investment in the deal.

*They lose internal credibility.* If the project has encountered problems, or if the champion has overcommitted to timelines that slipped, their ability to advocate for you is reduced. Their political capital is spent.

*They face competing priorities.* A major internal initiative has landed. The champion's attention is fully absorbed. Your deal is still on their list but not at the top.

*They were never as senior as they implied.* This is common. The champion represents themselves as having more influence than they actually have. When the deal needs to advance, they cannot deliver.

The mitigation is to have more than one champion wherever possible. And to maintain relationships with more than one person inside the account --- not to go around the champion, but to have intelligence from multiple angles.

== Champion vs Sponsor: The Critical Distinction

This distinction is the one most founders misidentify, and misidentifying it is expensive.

A *sponsor* is a senior person inside the customer organisation who supports the deal. They are enthusiastic about the technology. They say positive things about you in internal meetings. They have agreed to make an introduction.

A *champion* is a person at any level who is actively doing work to advance the deal. They have skin in the game. The deal's success is their success.

The distinction matters because sponsors do not close deals. Sponsors provide cover. They will not argue with procurement. They will not push back on a timeline delay. They will not go to the CFO and make the case for budget. They support the deal when it is easy to support, and they become neutral when it becomes difficult.

Founders frequently misidentify a VP or Director who has spoken warmly about the product as their champion. This person is a sponsor. The real champion is often the Head of Operations or the Data Engineering Lead who has built a proof of concept in their own time, argued with the procurement team about the security review, and told you that the CFO is on holiday next week and the approval needs to happen before they get back.

The test: "If this deal were in danger of being delayed by three months due to an internal priority conflict, what would [name] do about it?" A champion fights. A sponsor sympathises.

#sidebar("Florence Nightingale and Von Neumann",
  [Florence Nightingale introduced the systematic tracking of death causes in military hospitals during the Crimean War. Before her, nurses operated on intuition and tradition. She proved --- with a statistical visualisation that became a landmark in data communication --- that systematic tracking changed outcomes. Before her methods, soldiers died of preventable causes at catastrophic rates. After: they didn't. MEDDPICC is the systematic tracking. Without it, deals die of preventable causes.

  John von Neumann, one of the architects of game theory, established that optimal play requires complete knowledge of the game state. You cannot make the best move in a chess game without knowing where all the pieces are. MEDDPICC is the mechanism for knowing where all the pieces are in a deal. A founder who cannot describe the game state of their three most important deals is not playing optimally.]
)

#key-points([
  - MEDDPICC is a diagnostic tool, not a box-ticking exercise; use it to find gaps, not to fill a form
  - Unqualified deals consume pipeline capacity that could go to closeable deals — cut them early and decisively
  - Champion and Economic Buyer are the two relationships that determine whether deals close; both must be real
  - Metrics must be the buyer's metrics, stated in their language, tied to their business outcomes
  - A sponsor sympathises when the deal is hard; a champion fights. Know which one you have.
  - A deal you cannot fully qualify is not a deal — it is a research project with an unknown completion date
])

#top-tips([
  - Run a MEDDPICC gap analysis on every deal in your pipeline, weekly. Any field you cannot fill in is a next action.
  - If you cannot name the champion or articulate their personal stake in the outcome, you do not have a champion yet.
  - Ask the question nobody wants to ask: "What happens to this project if it doesn't get approved?" The answer tells you how real the urgency is.
  - Know the decision criteria before you propose. If you do not know, ask the champion to walk you through the last time they bought something of similar size.
  - Qualify out generously. The deal you cut loose in month two is better than the deal you lose in month eight.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 5
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "05",
  "The Late Game",
  [_"The impediment to action advances action. What stands in the way becomes the way."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Marcus Aurelius, _Meditations_, Book V]

  #v(0.6em)
  Marcus Aurelius governed Rome during simultaneous military campaigns, plague, and political instability. He did not control most of these. What he controlled was his response to them. The late game in enterprise sales is where most founders lose deals they should have won --- not to product inferiority, but to process failures they treated as inevitable rather than as problems to be solved.]
)

#fig("Marcus Aurelius writing in his campaign tent by lamplight. The Meditations were written in these conditions — not in comfort, but in the middle of the work. [Place chapter 5 illustration here]")

== The Stoic Approach to the Late Game

Marcus Aurelius governed Rome during a period of simultaneous military campaigns, plague, economic stress, and political instability. He did not control most of these. What he controlled was his response to them.

The Stoic insight is not that obstacles don't matter --- they clearly do. It is that anguishing over what you cannot control is a waste of the attention that should go to what you can. Map the situation clearly. Accept what is fixed. Move decisively on what is not.

The late game in enterprise sales is where most founders lose deals they should have won. Not because of product inferiority. Not because of price. Because the final steps --- the legal review, the procurement process, the security questionnaire, the internal approval journey --- are slow, opaque, and full of obstacles that feel like deal killers but are often just process.

The Stoic distinction: which of these obstacles are immovable facts of this organisation's buying process, and which are delays that can be shortened with the right action? Most of them are the latter. Most of the founders who lose deals in the last month do so because they stop acting --- they treat procurement's silence as rejection rather than as a vacuum that needs to be filled.

== Decision Criteria: The Rules of the Evaluation

Decision criteria are the explicit list of things the customer will evaluate your product against. In a formal procurement, they will be written down. In an informal evaluation, they exist but may not be articulated.

The question is not whether decision criteria exist. They always exist. The question is whether they were set with your involvement or without it.

*Criteria set with your involvement* are an advantage. If you have been in the discovery conversations when success criteria were being defined, you have had the opportunity to influence what they measure, which tends to favour your strengths. This is not manipulation --- it is the natural result of thorough discovery. If you understand the customer's problem better than your competitors, the criteria that accurately reflect the problem will tend to favour you.

*Criteria set without your involvement* are often a disadvantage. A competitor who has been in the account longer, or whose champion is closer to the evaluation team, will have shaped the criteria in their favour. You can often detect this when you see an RFP or evaluation framework that seems oddly specific about capabilities you don't have.

What to do when the criteria don't favour you:

First, understand the origin. Ask: "Who put this list together? What was the process?" Criteria that were set by procurement from a generic template are much more negotiable than criteria that were set by the technical team in consultation with their legal counsel.

Second, challenge the ones that are genuinely irrelevant. Not all decision criteria represent real requirements. Some are legacy items that nobody has thought to remove. "Why is this criterion important to you? How would you use this in practice?" often reveals that a requirement that looked blocking is actually a nice-to-have.

Third, accept the ones you can't change and compete on the ones you can. The Stoic approach. You cannot change the fact that they require SOC 2 Type II certification if they require it. You can move faster than your competitors on getting it.

== Decision Process: The Anatomy of a Yes

The decision process is the sequence of steps between a verbal yes and a signed contract. Founders consistently underestimate how many steps there are.

A typical enterprise decision process:

+ Champion recommendation to department head
+ Department head review and internal presentation
+ Informal EB approval in principle
+ Formal business case submission to finance
+ Finance review (cost/benefit analysis, vendor financial health)
+ Legal review (contract terms, IP, data ownership)
+ Security review (vendor security questionnaire, architecture review)
+ Procurement tender process or waiver
+ Formal board or executive approval
+ Purchase order raised
+ Contract signed

In a large enterprise, each of these steps can take weeks. Step 7 alone can stall a deal for two months if the security team is under-resourced or if your product handles personal data in a way that triggers additional review.

The discipline is to map this process explicitly, as early as possible. Ask the champion: "Walk me through how a purchase like this gets approved from here. Who needs to be involved, and in what order?" Then ask: "What typically takes the longest? Where do deals like this usually get stuck?"

The champion who can answer this question clearly is a genuine champion --- they know the process because they have navigated it before. The one who gives a vague answer is either not experienced enough with internal procurement or not invested enough in your deal to have found out.

== Paper Process: Start Early, Not Late

"Paper process" is everything that happens on the legal and administrative side of a deal: the NDA, the MSA (Master Services Agreement), the Order Form or Statement of Work, the Data Processing Agreement, the security questionnaire, and whatever other documents the customer's legal and procurement teams require.

The universal mistake is to start this process after the commercial agreement is reached. This is because starting the paper process feels premature before the deal is agreed --- and also because the paper process is uncomfortable, and there is a human tendency to delay discomfort.

The cost of this delay is significant. Legal review in a large enterprise can take six to twelve weeks. If the customer discovers at week eight of their security review that you handle personal data in a way that requires a DPA they haven't prepared, add another four weeks. If your MSA has terms that their legal team objects to --- and enterprise legal teams nearly always object to something --- each round of negotiation takes a week.

A deal that was "agreed in principle" in October and is targeting a January start can easily slip to April if the paper process starts in November.

The alternative: start the paper process in parallel with the commercial discussion, not after it. Send your standard MSA as part of the proposal. Ask for their security questionnaire at the same time as you provide the business case. Start the NDA process as soon as confidential information is being shared --- which is usually in the first technical conversation.

The customer who objects to starting the paper process early is signalling one of two things: they are not serious about the timeline, or they are not senior enough to push their own legal team to move. Both are useful intelligence.

#callout[*Note:* The legal documents in the Appendix of this book are not a substitute for qualified legal advice. They are starting points --- templates that reflect reasonable commercial norms for a UK-based SaaS vendor. Have a solicitor review your MSA before you use it in a deal. The cost of this is small compared to the cost of a badly drafted contract that binds you to terms you didn't intend.]

== Competition: Know the Full Landscape

Most founders have a reasonable view of their direct competitors --- other companies building similar technology. They have a much weaker view of the other two types of competition that are more likely to lose them deals.

*The incumbent:* The existing solution the customer is using, however imperfect. This might be a legacy software product, a manual process, or a combination of spreadsheets and workarounds. The incumbent has advantages you cannot match: it exists, it is paid for, the team knows how to use it, and switching it out involves risk and effort. You are not competing against the incumbent's features. You are competing against the organisational inertia that keeps it in place.

*Build vs buy:* Many enterprise customers who are evaluating your product are simultaneously discussing whether to build it themselves. The "build internally" option is a competitor. It is more likely to be chosen by: companies with large engineering teams, companies that see the capability as strategic and proprietary, and situations where no available product meets 80% of the requirements. Your response to this is not to argue that building is expensive (though it is). It is to demonstrate that your product's capabilities have been developed over time in ways that cannot be replicated in a short internal build, and that ongoing development and support is part of the value.

The question to ask early: "Is there any internal discussion about building this rather than buying it?" An honest champion will tell you. A positive answer does not kill the deal --- but it changes the conversation.

== Counter-Positioning

Counter-positioning is the strategy of placing your product in relation to the competition in a way that makes direct comparison difficult. It is not spin. It is the deliberate framing of your product's category.

The most effective counter-positioning answers the question: "What does this product do that the alternatives simply cannot, because of how they are built?" Not "we do it better." That is a feature comparison, and feature comparisons lead to feature evaluations, which lead to procurement decisions that favour the incumbent or the cheapest option.

Counter-positioning establishes a different axis of comparison. "We are the only product that does X in real time, because our architecture processes at the data layer rather than at the application layer. Any product that processes at the application layer cannot do X at scale." Now the comparison is about whether the customer needs real-time X --- which is a strategic question, not a feature comparison.

The build vs buy calculation:

#set text(size: 9pt)
#table(
  columns: (2.5fr, 1.5fr, 1.5fr),
  stroke: none,
  inset: (x: 0.7em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Factor]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Build]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Buy (your product)]),
  [Time to first deployment], [9--18 months], [4--8 weeks],
  [Engineering cost], [£400--600k year one], [ACV],
  [Ongoing maintenance], [1--2 engineers indefinitely], [Included],
  [Feature velocity], [Limited by internal capacity], [Shared across customer base],
  [Risk of under-delivery], [High (first time building)], [Lower (proven in other accounts)],
  [Strategic control], [Maximum], [Dependent on vendor roadmap],
)
#set text(size: 10.5pt)

Present this as a calculation, not a sales argument. The founder who walks through the build vs buy economics honestly --- including acknowledging the cases where building makes sense --- is more credible than the one who asserts that building is always a bad idea.

#sidebar("Clausewitz and Curie",
  [Clausewitz wrote that war is the continuation of politics by other means. The paper process is the continuation of selling by other means. Every redline in the MSA is a negotiating position. Every objection from procurement is a sales conversation conducted through contract language. The founder who treats legal negotiation as a separate, uncomfortable thing that happens after the real work is done will lose time and sometimes deals in the final weeks.

  Marie Curie worked for years on radioactivity research in conditions that were literally hostile to her health, her gender, and her institutional standing. She did not move faster by ignoring the obstacles. She moved faster by being more methodical than anyone around her. The paper process requires the same quality: patient, systematic, thorough. Document every request. Follow up on schedule. Know where every outstanding item sits. Speed in the final steps of a deal comes from organisation, not from chasing.]
)

#key-points([
  - Competition is wider than direct vendors: status quo, internal build, and "do nothing" are your most common opponents
  - The paper process is selling by other means; treat every procurement interaction as a negotiation
  - The build vs buy conversation is best had as a calculation, not a sales argument
  - Speed at the end of a deal comes from organisation and preparation, not from chasing
  - Know who needs to approve your deal before you write the proposal; structure accordingly
  - Competition won on value is durable; competition won on price is fragile
])

#top-tips([
  - Map every outstanding legal and procurement item with a named owner, a current status, and a due date. Review weekly.
  - Know your competitor's weaknesses before your buyer does. If a competitive displacement is possible, the champion needs ammunition to make the case internally.
  - If you are more than 60 days into a paper process with no signed order, there is a decision lurking that you have not yet found. Ask the champion directly: "What is the one thing that could still stop this?"
  - Present the build vs buy analysis yourself, including the cases where building might make sense. The founder who pre-empts the objection is more credible than the one who reacts to it.
  - The commercial summary document (Appendix E) can halve the time from verbal agreement to signed order. Use it.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 6
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "06",
  "The War Room",
  [_"Failure is not an option."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Gene Kranz, Flight Director, NASA Apollo 13]

  #v(0.6em)
  On 13 April 1970, an oxygen tank aboard Apollo 13 exploded 200,000 miles from Earth. Gene Kranz did not attempt to solve the crisis alone. He assembled his team in Mission Control, divided the problem into parallel workstreams, assigned ownership to individuals, and imposed a discipline of communication that prevented the chaos of the situation from becoming the chaos of the response. "Failure is not an option" was not a motivational slogan. It was an operating principle for a team under extraordinary pressure. The enterprise deal, in its most critical weeks, requires the same quality of response. Not one person solving all the problems. A team, organised, owning the work, and communicating with precision.]
)

== The Myth of the Lone Wolf Closer

The mythology of sales celebrates individual heroes: the rainmaker who wins the impossible deal, the founder who closes a Series A customer on charm and conviction, the rep who goes around the system and makes something happen. These stories are real. They are also the exception.

Enterprise deals of substance are won by teams. The champion works their internal network. The technical team handles the proof of concept. The legal team negotiates the paper. The executive sponsor provides air cover with the customer's board. The founder or account lead orchestrates. No single person does all of this well, and no deal of complexity should depend on one person doing so.

The War Room is the organising principle for a deal that matters: a shared space --- physical or virtual --- where the team thinks together, challenges each other, and owns the work collectively. Salient is built around this model. The deal is not the founder's deal. It is the team's deal.

This chapter is not in the main methodology of Salient because MEDDPICC is an individual discipline that any one person can apply. The War Room is the team discipline that makes the methodology work at scale. Both are required.

== War Room Discipline

The War Room is not a meeting. It is a discipline that expresses itself through meetings, but its value is in the habits that surround the meetings.

=== Pre-Meeting Scheming

Before any significant customer meeting --- EB presentation, commercial proposal, negotiation session --- the team meets to prepare. This is not a rehearsal. It is a strategy session.

Agenda: What do we know about this meeting? What are the likely objections? What does a successful outcome look like, in specific terms? What are the three most important things we need to learn? Who is in the room, and what do each of them care about? What does the champion tell us about the internal dynamics? What have we agreed with the customer to date, and does it still hold?

The pre-meeting scheming session should be shorter than the meeting it is preparing for. Thirty minutes of focused preparation will change what happens in a one-hour EB call more than any amount of polishing the slide deck.

=== Red Team / Blue Team

The blue team is the deal team: they believe in the deal, know its strengths, and are motivated to close it. The red team takes the buyer's perspective --- or the competitor's perspective --- and challenges every assumption.

Red teaming works because the human brain is not good at finding the flaws in its own plans. When you have lived with a deal for three months, you have developed explanations for why the unusual things are not problems. The red team has not. They see the deal fresh, and they will find the problems you have been explaining away.

The discipline: the red team is not supposed to be polite. They are supposed to be ruthless. "What is the single most likely reason this deal does not close?" is the opening question. Work through it methodically. Then let the blue team respond. The gaps between the red team's attack and the blue team's defence are the actions.

=== Shared Action Ownership

Every action item from a War Room session has: a description, a named owner, and a date. Not "we should follow up with the legal team." But "Sandy will send the redlined MSA to [Customer] legal with a cover note explaining clause 8 by Thursday."

This is not bureaucracy. It is the mechanism by which a team coordinates without the founder having to chase every thread personally. The weekly War Room review opens with: what was committed, what was done, what is outstanding, and what is now at risk.

=== The Question Nobody Wants to Ask

Every deal has a question that the team is collectively avoiding. It is usually the most important question in the deal.

"Does the CFO actually know about this deal?"

"Has anyone told the champion that the procurement timeline they described is not achievable?"

"Is the EB actually going to approve this, or are they just being polite to the founder?"

The War Room's job is to surface this question and answer it. The team lead's job is to create an environment where it is safe to ask it. Founders who build War Rooms where difficult truths are unwelcome will find that their team stops bringing them.

== Roles in the Room

Not every deal needs every role. But knowing what each role does helps you see the gaps.

*Deal owner:* Accountable for the deal. Knows the MEDDPICC status of every field. Makes the final call on strategy. Usually the founder or lead AE.

*Coach / analyst:* Challenges assumptions, maintains the qualification rigour, asks the question nobody wants to ask. In Salient, the Team Coach agent plays a version of this role in every session.

*Red team lead:* Takes the opposing position in preparation sessions. Best filled by someone not close to the deal — another founder, a senior advisor, or a board member with sales experience.

*Executive sponsor:* Provides peer-level relationship with the customer's economic buyer. Opens doors the deal team cannot open. Should not be involved in day-to-day deal mechanics.

*Administrative owner:* Owns the paper process. Tracks every document, every outstanding redline, every procurement request. Detail-oriented and organised. Often underrated until the deal is stuck in legal.

== Red Teaming as a Discipline

Red teaming is worth treating separately from the War Room because it is the discipline most often skipped.

The reason it is skipped: it is uncomfortable. The deal team has invested time, emotion, and credibility in a deal. Having someone tell them the deal is likely to fail, and why, is genuinely difficult. The founder who started the company, ran the demo, built the champion relationship, and written the proposal does not want to hear that the EB is probably not going to approve it.

The reason it must not be skipped: the red team's discomfort is minor compared to the cost of a deal that fails in month eight because of a problem that was visible in month five and not addressed.

The minimum viable red team session: take your three most important deals. For each, give someone not on the deal team fifteen minutes to read the deal summary (MEDDPICC state, current status, next steps) and then ask them one question: "What is the most likely reason this deal does not close?" Listen without defending. Write down what they say. Discuss after.

Do this monthly on your top deals. The friction is worth it.

== The Agent as Team Member

One of the structural challenges of early-stage enterprise selling is that the team is small. The founder is often the deal owner, the red team, the coach, and the administrative owner simultaneously. There is no one to challenge their assumptions who is not also the person who made the assumptions.

The Team Coach in Salient is a partial answer to this. It cannot replace a human red team. But it can ask the questions that a good coach would ask, challenge the deal state with Socratic precision, and surface gaps that the founder has been explaining away.

More broadly: agentic tools are beginning to democratise the War Room. The preparation work that used to require a team --- competitive analysis, market research, stakeholder mapping, document drafting --- can now be done with an AI collaborator in a fraction of the time. This compresses the time-cost of running a proper War Room for a team of two or three.

The implication is not that founders should not hire. It is that the first few hires can be more senior, and more focused on relationships and judgement, because the administrative and analytical work is increasingly handled by agents. The War Room becomes viable earlier in the company's life.

== Debrief Culture

Win or lose, the deal is not over when it closes. It is over when the debrief is complete.

The post-mortem on a lost deal is obvious: what did we miss? Where did the qualification fail? What would we do differently? But the post-mortem on a won deal is equally important and far more often skipped.

What won this deal? Was it the champion? The timing? The pricing? A competitor's mistake? If you do not know why you won, you cannot reliably replicate it. You will ascribe the win to your general brilliance and miss the specific factors that actually mattered.

The debrief has three parts: what we said we would do (the plan), what actually happened (the reality), and what we will do differently next time (the learning). It should take no more than 45 minutes and should produce at least three specific action items for the next deal of this type.

In Salient, the debrief agent is the tool for this conversation. Use it.

== The Weekly Cadence

The War Room requires a cadence. Without it, the discipline lapses between crises. The cadence is what prevents the Sisyphean pattern.

*Weekly deal review (30--45 minutes):* Cover every live deal above a value threshold. For each: current stage, MEDDPICC status, next action, and any blockers. The meeting should be run from the Salient pipeline view, not from a spreadsheet.

*Bi-weekly pipeline review (60 minutes):* Broader view. Includes deals at early stage. What is coming into the pipeline? What is the coverage against the annual plan? Are there patterns in what is qualifying and what is not?

*Monthly red team session (60 minutes):* Take the top three deals. Apply the red team discipline described above. Produce action items.

*Quarterly planning (half day):* Review the annual plan. Adjust based on what is actually happening. What does the pipeline look like against target? What has changed in the market, the product, or the competitive landscape?

The weekly cadence is not optional. It is the mechanism by which strategy becomes execution.

#sidebar("Shackleton and Turing",
  [Ernest Shackleton's Endurance expedition became trapped in Antarctic ice in 1915. For 22 months, Shackleton managed a team of 27 men under conditions of extraordinary physical and psychological stress. Not one person died. The outcome was not the result of Shackleton's individual heroism. It was the result of his discipline in maintaining team morale, distributing responsibility, and creating a structure within which each person knew their role. The War Room, at its best, is Shackleton's approach applied to a deal: every person knows what they own, and the leader's job is to keep the team functional under pressure.

  Alan Turing's work at Bletchley Park succeeded not because Turing was brilliant in isolation --- though he was --- but because he worked within a team that combined mathematical talent, linguistic expertise, operational experience, and mechanical engineering. The breakthrough on the Enigma machine required all of these simultaneously. No single person could have done it. The enterprise deal of substance requires the same combination of skills. Build the team, run the War Room, and win the deal together.]
)

#key-points([
  - Enterprise deals of substance are won by teams, not individuals; the War Room is the organising principle
  - Pre-meeting scheming (30 minutes before significant customer meetings) changes outcomes more than slide polish
  - Red teaming is the discipline most often skipped and the one most correlated with avoiding late-stage deal failures
  - Every action item needs a description, a named owner, and a date — not "we should follow up"
  - The question nobody wants to ask is usually the most important question in the deal; the War Room's job is to surface it
  - Agentic tools democratise the War Room for small teams; the Team Coach is a partial substitute for a human challenger
  - Debrief every deal, won or lost; if you do not know why you won, you cannot reliably replicate it
])

#top-tips([
  - Run pre-meeting scheming for every EB presentation and every negotiation session. 30 minutes. The same agenda every time.
  - Red team your top three deals monthly. Give someone not on the deal team 15 minutes to read the deal summary, then ask: "What is the most likely reason this doesn't close?"
  - Start every weekly deal review by reading the actions from the previous week. If they were not done, that is the first discussion.
  - The debrief on a won deal is as important as the debrief on a lost one. Know why you won.
  - If you are running a War Room alone (as a solo founder), use the Team Coach as your challenger. It will not pull punches if you tell it not to.
])

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 7
// ═══════════════════════════════════════════════════════════════════════════════
#chapter-opener(
  "07",
  "Negotiation: Getting to Yes (and Knowing When to Walk)",
  [_"Beware of the man who works hard to learn something, learns it, and finds himself no wiser than before. He is full of murderous resentment of people who are ignorant without having come to the trouble of learning."_

  #v(0.4em)
  #text(fill: muted, size: 9.5pt)[--- Homer, _The Odyssey_ (after Odysseus)]

  #v(0.6em)
  Odysseus did not win the Trojan War with strength. He won it with cunning, patience, and a willingness to use every tool available to him --- including the horse, the stratagem, the lie, and the long wait. He was the cleverest man in the room, but he never let it show until the moment it mattered. Enterprise negotiation is not a battle of strength. It is a test of preparation, patience, and the willingness to walk away from a deal that will cost more than it returns. The founder who goes into a negotiation without preparation will be outmanoeuvred by a procurement team that does this every week.]
)

#callout[A note on ethics: this chapter describes negotiation tactics that are in common use in commercial settings and are legitimate tools for any party in a negotiation. It does not endorse deception, misrepresentation, or tactics that exploit power asymmetries unethically. The best negotiators build long-term reputations for fairness. In a market as small as B2B enterprise, your reputation from this negotiation will precede you into the next one.]

== Negotiation Starts Before the Meeting

The outcome of a negotiation is largely determined before the first concession is made. The preparation is the negotiation.

Before any commercial negotiation, you need to know five things:

*Your BATNA* (Best Alternative to a Negotiated Agreement): What do you do if this deal does not close? If your BATNA is weak --- if you have no other deals in the pipeline, or if this customer represents more than 30% of your target ARR --- you will make concessions you should not make.

*Their BATNA:* What happens to them if this deal does not close? Are they facing a board deadline? Is the alternative to buy from you to build internally (expensive and slow)? Is there a regulatory trigger driving their timeline? Understanding their BATNA tells you how much leverage you have.

*Your walk-away point:* The minimum terms at which this deal is worth doing. Know this before you sit down. Below this point, you say no.

*Your anchor:* The opening position you intend to state. It should be ambitious but defensible. The anchor sets the frame for the negotiation that follows.

*Your trade list:* The things you are willing to move on (and by how much), and the things you are not. This is not about flexibility in principle --- it is about the specific levers available to you: price, payment terms, contract length, SLA parameters, pilot scope, implementation support.

The founder who enters a negotiation without this preparation will improvise. Improvisation in negotiation produces worse outcomes than preparation, consistently.

== BATNA: The Foundation of Leverage

Your BATNA is the most important number in any negotiation. Not the price. The BATNA.

A strong BATNA --- three other qualified deals at similar ACV --- gives you the ability to say no to a bad deal without catastrophic consequence. A weak BATNA means you will accept terms that erode your margin, set a damaging precedent with your first enterprise customer, and signal to the market that you are negotiable in ways that will follow you for years.

The strategic implication: pipeline coverage is not just a revenue forecasting tool. It is a negotiating tool. The founder who has built strong pipeline coverage going into a commercial negotiation has more leverage than the one who has been working this single deal for six months and has nothing else at the same stage.

Build your BATNA before you negotiate, not during.

== Anchoring: Who Puts the Number on the Table First

There is a genuine debate among negotiation practitioners about whether to anchor first (put your number on the table) or to invite the other party to go first. The evidence is reasonably clear: anchoring first is advantageous when you have a defensible position and when your anchor is ambitious.

The anchor creates the psychological frame for the negotiation. Even experienced negotiators anchor on the first number they hear, and adjustments from that anchor are typically insufficient. An ambitious anchor sets a high reference point from which concessions still produce an acceptable outcome.

*When to anchor first:* When you have done the pricing work, your anchor is defensible with reference to value delivered, and you are willing to hold it under initial pushback.

*When to let them go first:* When you genuinely do not know their budget range and the information value of hearing it outweighs the anchoring advantage. This is more common in early conversations, less common in formal commercial negotiations.

*How to anchor:* State the price with rationale, not as a request for approval. "Our standard pricing for an organisation of your size is £X, reflecting [value delivered]. We're prepared to discuss structure, but this is where we start." Do not apologise for the number.

== Never Split the Difference

Chris Voss, former FBI hostage negotiator, identified a pattern that is directly applicable to commercial negotiation: when a counterpart asks you to split the difference, they are usually anchoring on a midpoint between a position they chose strategically and your real position. Splitting the difference rewards them for their anchor, not for the actual merit of the positions.

The alternative: when asked to split the difference, acknowledge the request without conceding to it. "I understand you are looking for something in the middle. Let me think about what I can do that gets us closer, because I can't simply split from where we are." Then make a move that is smaller than the split they asked for, and attach a condition to it.

More broadly: every concession you make should be labelled as a concession, should be smaller than the previous concession (to signal that you are approaching your limit), and should ideally be attached to something you receive in return.

*The concession pattern:* Large initial move (to signal goodwill and create momentum), then progressively smaller moves, then a final number stated clearly as final. "I can go to £X. That is my best number. I am not going to be able to move further from here."

== Trade, Not Concede

The discipline of trading rather than conceding is one of the highest-value negotiation habits available to a founder.

*Concession:* You give something. They receive it. The deal moves in their direction.

*Trade:* You give something conditional on receiving something in return. The deal moves, but both sides move.

The items available for trading in a software contract are wider than most founders realise:

- Price in exchange for contract length (longer term at lower annual rate)
- Price in exchange for payment terms (upfront payment for a discount)
- Implementation support in exchange for a reference customer commitment
- Pilot scope reduction in exchange for a faster close
- SLA parameters (response time, uptime guarantee) in exchange for price
- Feature priority (roadmap commitment) in exchange for a larger ACV

The principle: do not give anything without asking for something. "I think we can move on pricing if you're willing to commit to a two-year term. Can we explore that?" is better than "We can do £X." The first is a trade. The second is a concession.

== No as a Signal

In enterprise sales, "no" is rarely final. It is usually a signal.

"No" to the price is usually "I do not have authority to approve this at that price" or "I need a different structure" or "I need something to take to the CFO."

"No" to the timeline is usually "I have a competing priority" or "the internal process takes longer than you think" or "I do not have the mandate yet."

"No" to the pilot scope is usually "I am not confident enough in the outcome to commit resources" or "I need a lower-risk entry point."

The skill is in reading which kind of "no" you have received. The champion is usually the best source of that intelligence. After a "no" from the EB, the conversation with the champion is: "What was behind that? Is it a pricing problem, a process problem, or a problem with how we presented the case?"

A "no" that is a signal requires a different response than a "no" that is a decision. The founder who treats every "no" as a decision will lose deals they should have won. The founder who treats every "no" as a signal will chase deals they should have cut.

The test: "What would need to be true for this to move forward?" If there is an answer, the "no" is a signal. If there is no answer, it is a decision.

== Time as a Weapon

Both parties in a negotiation have a relationship with time. Understanding theirs, and managing yours, is a significant lever.

*Artificial deadlines:* The buyer's procurement team will often impose a deadline on you. This deadline may or may not be real. A quarter-end deadline from procurement is usually soft. A regulatory submission date is usually hard. A "we need to decide before the board meeting" is usually somewhere in between. Ask the champion which category this falls into.

*Your own timeline:* Do not manufacture fake urgency unless you are prepared to hold it. "Our pricing is only available at this level until end of quarter" is a tactic. If the customer calls your bluff and asks for the same price next quarter, you need to be willing to walk away. Tactics that you are not willing to hold create the appearance of weakness.

*Patience:* In the majority of negotiations, the party that is more patient will receive better terms. Enterprise procurement teams are experienced at waiting. Founders who need to close for cash flow reasons are at a disadvantage. This is another argument for BATNA: a strong pipeline means you can afford to be patient.

*The deadline you set:* If you have made a proposal, set a review date. "I'll follow up on Thursday to understand where you are." This is not pressure — it is process management. It keeps the deal on the table and prevents the silence that signals stagnation.

== Knowing When to Call Time

The hardest judgement in enterprise sales is when to stop pursuing a deal.

The signals that it is time:

- The champion has stopped responding and cannot explain why
- The EB has "deprioritised" the project without a rescheduled timeline
- The deal has been "in legal review" for more than 90 days without specific progress
- The decision criteria have shifted multiple times and now align precisely with a competitor's strengths
- You have been asked to reduce price below your walk-away point and the other party has not moved on anything in return

The cost of not walking away is underestimated. A deal that is unlikely to close in six months consumes pipeline reviews, management attention, coaching sessions, and founder energy. That cost is borne entirely by you. The customer's cost of keeping you in the process is close to zero.

Walking away is not failure. It is qualification. The discipline of saying "we are going to close this or take it off the pipeline" is what allows a small team to maintain the cadence that the annual plan requires.

How to walk away: professionally, specifically, and with a clear return condition. "We've been working on this for six months and I think we're both at a point where the timing isn't right. I'm going to take this off our active pipeline, but I'd love to revisit in Q3 when [specific trigger]. Would that work?" This closes the deal without burning the relationship.

== What Salient Doesn't Coach

Salient's Team Coach will help you prepare for negotiations, challenge your deal state, and think through leverage and BATNA. It will not tell you to do things that are ethically wrong or that will damage long-term relationships.

The following are outside the scope of responsible sales coaching:

- Misrepresenting product capability, delivery timelines, or reference customers
- Using personal information about a counterpart in ways they would not consent to
- Creating artificial scarcity or urgency that is not real
- Exploiting information asymmetries that the counterpart would object to if they understood them

These tactics may produce short-term wins. In a market as small and interconnected as the one you are selling into, they will produce long-term consequences. Enterprise sales is a reputation-dependent activity. Your counterpart in today's negotiation is tomorrow's reference, competitor, board member, or investor.

Negotiate hard. Negotiate well. But negotiate with the relationship in mind.

#sidebar("Odysseus and Mandela",
  [Odysseus spent ten years trying to get home. He was not weak. He was strategic. He outwitted the Cyclops with cunning, navigated between Scylla and Charybdis by planning, and escaped the island of Calypso through patience and diplomacy. He never fought when he could think his way through. In enterprise negotiation, the founder who knows their BATNA, has done the preparation, and can hold their anchor under pressure will outperform the founder who relies on relationship warmth or product belief alone.

  Nelson Mandela negotiated the end of apartheid from a position of formal powerlessness and emerged with a settlement that both sides could accept. His preparation was legendary: he studied his opponents, understood their constraints, knew what they needed to be able to say to their own constituencies, and structured his proposals accordingly. The deal you are trying to close may be smaller in scale, but the principle is the same: understand what the other side needs, not just what they are asking for, and you will find room to move that a less-prepared negotiator would never have seen.]
)

#key-points([
  - Negotiation outcome is largely determined by preparation, not by the conversation itself
  - BATNA is the foundation of leverage; build pipeline coverage before you negotiate, not during
  - Anchoring first with a defensible, ambitious position is almost always advantageous
  - Trade, do not concede: every move you make should be attached to a condition
  - "No" is usually a signal, not a decision; the champion can translate what it means
  - Time is a weapon on both sides; patience is a structural advantage in most enterprise negotiations
  - Know your walk-away point before you sit down, and be willing to use it
  - Reputation persists beyond the deal; negotiate hard but negotiate with the relationship in mind
])

#top-tips([
  - Write down your BATNA, their BATNA, and your walk-away point before any commercial negotiation. If you have not done this, you are not ready.
  - When asked to split the difference, do not. Make a smaller conditional move instead.
  - State your anchor without apologising for it. Apology signals flexibility that has not yet been tested.
  - Use the Negotiation Preparation Worksheet (Appendix F) before any deal above £50k ACV.
  - If the champion stops responding, the deal has a problem. Do not wait for it to resolve itself.
  - Walk away professionally. "Not now" with a clear return condition preserves the relationship.
])

// ═══════════════════════════════════════════════════════════════════════════════
// APPENDIX
// ═══════════════════════════════════════════════════════════════════════════════
#pagebreak()
#chapter-state.update("Appendix")
#v(2cm)
#text(size: 20pt, weight: "bold", fill: textcol, font: "Gill Sans", "Appendix")
#v(0.4em)
#text(size: 12pt, fill: accent, font: "Gill Sans", "Starter Documents for the Paper Process")
#v(0.5em)
#line(length: 100%, stroke: 1.5pt + accent)
#v(1em)

#set text(size: 10pt)
These documents are templates for reference only. They reflect reasonable commercial norms for a UK-based software vendor but are not a substitute for legal advice specific to your situation. Have a qualified solicitor review any document before using it in a live commercial transaction.
#set text(size: 10.5pt)

// ── A. NDA ────────────────────────────────────────────────────────────────────
#appendix-doc("A. Mutual Non-Disclosure Agreement",
  subtitle: "Mutual · England and Wales · Suitable for confidential evaluation discussions")

#set text(size: 9.5pt)

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] between:

*[VENDOR NAME]*, a company registered in England and Wales (registered number [NUMBER]) with its registered office at [ADDRESS] ("Vendor"); and

*[CUSTOMER NAME]*, a company registered in [JURISDICTION] (registered number [NUMBER]) with its registered office at [ADDRESS] ("Customer").

Vendor and Customer are each referred to herein as a "Party" and collectively as the "Parties."

#appendix-section("1. Purpose")

The Parties wish to explore a potential commercial relationship and, in connection with that exploration, may disclose to each other certain confidential and proprietary information. This Agreement governs those disclosures.

#appendix-section("2. Confidential Information")

"Confidential Information" means any information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), either directly or indirectly, in writing, orally or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.

Confidential Information does not include information that: (a) is or becomes generally known to the public other than through a breach of this Agreement by the Receiving Party; (b) was known to the Receiving Party prior to its disclosure by the Disclosing Party, as evidenced by written records pre-dating the disclosure; (c) is received from a third party without restriction and without breach of any obligation of confidentiality; or (d) is independently developed by the Receiving Party without use of or reference to the Disclosing Party's Confidential Information.

#appendix-section("3. Obligations")

Each Receiving Party agrees to: (a) hold the Disclosing Party's Confidential Information in strict confidence; (b) not disclose such Confidential Information to any third party without the prior written consent of the Disclosing Party; (c) use such Confidential Information solely for the purpose of evaluating the potential commercial relationship between the Parties (the "Permitted Purpose"); (d) restrict disclosure to those of its employees, contractors, and advisers who have a need to know the information for the Permitted Purpose and who are bound by obligations of confidentiality no less restrictive than those set out herein; and (e) promptly notify the Disclosing Party upon becoming aware of any unauthorised disclosure or use of Confidential Information.

#appendix-section("4. Compelled Disclosure")

A Receiving Party may disclose Confidential Information to the extent required by applicable law, regulation, or court order, provided that the Receiving Party: (a) gives the Disclosing Party prompt written notice of such requirement (to the extent permitted by law); (b) cooperates with the Disclosing Party in seeking a protective order or other appropriate relief; and (c) discloses only that portion of the Confidential Information that is legally required to be disclosed.

#appendix-section("5. Return or Destruction")

Upon the Disclosing Party's written request, or upon termination of this Agreement, the Receiving Party shall promptly return or destroy all Confidential Information (including all copies) and, upon request, certify such return or destruction in writing.

#appendix-section("6. No Licence")

Nothing in this Agreement grants either Party any right, title, interest, or licence in or to any intellectual property of the other Party. The Parties acknowledge that no commitment to enter into any further agreement is created by this Agreement.

#appendix-section("7. Term")

This Agreement shall commence on the date first written above and shall continue for a period of two (2) years, unless earlier terminated by either Party on thirty (30) days' written notice. The obligations of confidentiality shall survive termination of this Agreement for a further period of three (3) years.

#appendix-section("8. Remedies")

Each Party acknowledges that any breach of this Agreement may cause irreparable harm for which monetary damages would be an inadequate remedy, and that the Disclosing Party shall therefore be entitled to seek injunctive or other equitable relief in addition to any other remedies available at law.

#appendix-section("9. Governing Law")

This Agreement shall be governed by and construed in accordance with the laws of England and Wales. The Parties irrevocably submit to the exclusive jurisdiction of the courts of England and Wales.

#appendix-section("10. General")

This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior discussions and agreements. It may be amended only by a written instrument signed by authorised representatives of both Parties.

#v(1.5em)
#sig-block("[VENDOR NAME]")
#sig-block("[CUSTOMER NAME]")

// ── B. SAAS LICENCE ───────────────────────────────────────────────────────────
#appendix-doc("B. Software Subscription Licence Agreement",
  subtitle: "Cloud-delivered SaaS · Annual subscription · England and Wales")

This Software Subscription Licence Agreement ("Agreement") is entered into as of [DATE] between *[VENDOR NAME]* ("Vendor") and *[CUSTOMER NAME]* ("Customer").

#appendix-section("1. Definitions")

"*Authorised Users*" means Customer's employees, contractors, and agents who are permitted to access the Software, up to the number specified in the Order Form. "*Order Form*" means the written document executed by the Parties specifying the subscription details, fees, and term. "*Software*" means the cloud-delivered software product identified in the Order Form, together with any updates provided by Vendor during the Subscription Term. "*Subscription Term*" means the period specified in the Order Form.

#appendix-section("2. Licence Grant")

Subject to the terms of this Agreement and payment of the applicable fees, Vendor grants to Customer a non-exclusive, non-transferable, non-sublicensable licence to access and use the Software during the Subscription Term solely for Customer's internal business purposes.

#appendix-section("3. Restrictions")

Customer shall not, and shall ensure that Authorised Users do not: (a) copy, modify, or create derivative works of the Software; (b) reverse engineer or attempt to derive the source code; (c) sublicence, sell, or transfer the Software; (d) access the Software for purposes of competitive analysis or to build a competing product; (e) use the Software in violation of applicable law; or (f) exceed the number of Authorised Users specified in the Order Form.

#appendix-section("4. Fees and Payment")

Fees are as specified in the Order Form. Unless otherwise stated, fees are payable annually in advance. All fees are exclusive of VAT. Customer shall pay undisputed invoices within thirty (30) days of receipt. Overdue amounts shall bear interest at 4% per annum above the Bank of England base rate.

#appendix-section("5. Data Ownership")

Customer retains all rights, title, and interest in and to all data inputted into or generated by Customer's use of the Software ("Customer Data"). Vendor shall not use Customer Data for any purpose beyond providing the Software, including the training of machine learning models, without Customer's prior written consent.

#appendix-section("6. Intellectual Property")

Vendor retains all rights, title, and interest in and to the Software and all related intellectual property. No rights are granted to Customer except as expressly set out in this Agreement.

#appendix-section("7. Warranties")

Vendor warrants that: (a) the Software will perform materially in accordance with the Documentation; and (b) Vendor has the right to enter into this Agreement. TO THE EXTENT PERMITTED BY LAW, ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, ARE EXCLUDED.

#appendix-section("8. Limitation of Liability")

TO THE EXTENT PERMITTED BY LAW: (a) Neither Party shall be liable for indirect, incidental, special, or consequential damages, including loss of revenue, profit, or data. (b) Vendor's total aggregate liability shall not exceed the fees paid by Customer in the twelve (12) months preceding the event giving rise to the claim. Nothing in this Agreement excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.

#appendix-section("9. Term and Termination")

This Agreement shall continue for the Subscription Term. Either Party may terminate on written notice if the other Party materially breaches this Agreement and fails to cure such breach within thirty (30) days of written notice, or immediately if the other Party becomes insolvent. On termination, Customer's access to the Software shall cease and each Party shall return or destroy the other's Confidential Information.

#appendix-section("10. Governing Law")

This Agreement shall be governed by the laws of England and Wales.

// ── C. PILOT AGREEMENT ───────────────────────────────────────────────────────
#appendix-doc("C. Pilot / Proof of Concept Agreement",
  subtitle: "90-day evaluation · No charge · Defined success criteria · England and Wales")

This Pilot Agreement ("Agreement") is entered into as of [DATE] between *[VENDOR NAME]* ("Vendor") and *[CUSTOMER NAME]* ("Customer").

#appendix-section("1. Purpose")

The Parties wish to conduct a time-limited evaluation of the Vendor's software product ("[PRODUCT NAME]") (the "Pilot") to assess its suitability for Customer's requirements.

#appendix-section("2. Pilot Term")

The Pilot shall commence on [START DATE] and continue for ninety (90) days (the "Pilot Term"), unless extended by mutual written agreement or earlier terminated as set out herein.

#appendix-section("3. Scope of Access")

During the Pilot Term, Vendor shall provide Customer with access to the Software for evaluation purposes only: Users: up to [NUMBER] Authorised Users; Environments: [DESCRIPTION]; Data: Customer may use [real / anonymised / synthetic] data; Features: [Full product access / The following features: ...].

#appendix-section("4. Success Criteria")

The Parties agree that the following measurable criteria ("Success Criteria") will be used to evaluate the Pilot:

#set text(size: 9pt)
#table(
  columns: (2fr, 2fr, 1.5fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Criterion]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Measurement method]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Target]),
  [[Criterion 1]], [[Method]], [[Target]],
  [[Criterion 2]], [[Method]], [[Target]],
  [[Criterion 3]], [[Method]], [[Target]],
)
#set text(size: 9.5pt)

The Parties shall review progress against the Success Criteria at Day 45 and Day 90.

#appendix-section("5. Fees")

The Pilot is provided at no charge. Customer acknowledges that the Pilot access is for evaluation purposes only and does not constitute a commercial deployment.

#appendix-section("6. IP, Data, and Confidentiality")

All intellectual property in the Software remains with Vendor. All data inputted by Customer remains the property of Customer. Vendor shall not use Customer Data for any purpose beyond providing access during the Pilot. On expiry or termination, Vendor shall delete or return Customer Data within thirty (30) days of a written request. All information exchanged is Confidential Information subject to the terms of the NDA between the Parties.

#appendix-section("7. No Warranties")

The Software is provided "as is" during the Pilot Term. Vendor makes no warranties regarding the Software's fitness for purpose, accuracy, or availability during the Pilot.

#appendix-section("8. Conversion to Commercial Agreement")

If Customer wishes to proceed to a commercial subscription following the Pilot, the Parties shall negotiate in good faith. Participation in the Pilot does not obligate Customer to enter into any commercial agreement. Vendor shall provide a commercial proposal no later than fourteen (14) days before the end of the Pilot Term.

#appendix-section("9. Termination")

Either Party may terminate this Agreement on seven (7) days' written notice. On termination, Customer's access to the Software shall cease immediately.

#appendix-section("10. Governing Law")

This Agreement is governed by the laws of England and Wales.

#v(1.5em)
#grid(
  columns: (1fr, 1fr),
  gutter: 2em,
  sig-block("[VENDOR NAME]"),
  sig-block("[CUSTOMER NAME]"),
)

// ── D. DPA ────────────────────────────────────────────────────────────────────
#appendix-doc("D. Data Processing Agreement",
  subtitle: "UK GDPR · Controller / Processor · Incorporated into the Main Agreement")

This Data Processing Agreement ("DPA") is entered into as of [DATE] and forms part of the Software Subscription Licence Agreement (or Pilot Agreement) between *[VENDOR NAME]* ("Processor") and *[CUSTOMER NAME]* ("Controller").

#appendix-section("1. Background and Roles")

In connection with the services provided by Processor under the Main Agreement, Processor will process personal data on behalf of Controller. For the purposes of UK GDPR and the Data Protection Act 2018: Controller determines the purposes and means of the processing; Processor processes personal data only on behalf of the Controller and in accordance with the Controller's documented instructions.

#appendix-section("2. Processing Details")

#set text(size: 9pt)
#table(
  columns: (1.5fr, 2.5fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Element]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Details]),
  strong[Subject matter], [Personal data processed in connection with [PRODUCT NAME]],
  strong[Duration], [For the term of the Main Agreement],
  strong[Nature and purpose], [[e.g., Storage, analysis, and display of operational data]],
  strong[Types of personal data], [[e.g., Names, email addresses, job titles, usage data]],
  strong[Categories of data subjects], [[e.g., Customer's employees and contacts]],
)
#set text(size: 9.5pt)

#appendix-section("3. Processor Obligations")

Processor shall: (a) Process personal data only in accordance with Controller's documented instructions; (b) Ensure that all persons authorised to process personal data are subject to appropriate confidentiality obligations; (c) Implement appropriate technical and organisational security measures, including encryption of personal data at rest and in transit, and ability to ensure ongoing confidentiality, integrity, and availability of processing systems; (d) Not engage sub-processors without Controller's prior written consent (general or specific) --- current sub-processors are listed in Schedule 1; (e) Assist Controller with data subject rights (access, erasure, restriction, portability, objection) and security obligations; (f) Notify Controller without undue delay (and in any event within 48 hours) upon becoming aware of a personal data breach; (g) Delete or return all personal data to Controller upon termination of the Main Agreement and certify such deletion in writing.

#appendix-section("4. Controller Obligations")

Controller warrants that it has the legal basis necessary to transfer personal data to Processor for the purposes contemplated by this DPA, and that its instructions comply with applicable data protection law.

#appendix-section("5. International Transfers")

Processor shall not transfer personal data outside the UK or EEA without the prior written consent of Controller, except to countries with adequacy status or where appropriate safeguards (such as standard contractual clauses) are in place.

#appendix-section("6. Audits")

Processor shall make available to Controller all information reasonably necessary to demonstrate compliance with this DPA, and shall allow for audits conducted by Controller or a mandated auditor, on reasonable notice and subject to confidentiality obligations.

#appendix-section("Schedule 1 — Sub-processors")

#set text(size: 9pt)
#table(
  columns: (1.5fr, 2fr, 1.5fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Sub-processor]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Purpose]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Location]),
  [[e.g., AWS / GCP / Azure]], [Cloud hosting and infrastructure], [[UK / EU / US + SCCs]],
  [[e.g., Support tooling]], [Customer support], [[Location]],
)
#set text(size: 9.5pt)

Controller grants general authorisation for the sub-processors listed above. Processor shall notify Controller at least 30 days in advance of any intended changes.

// ── E. COMMERCIAL SUMMARY ─────────────────────────────────────────────────────
#appendix-doc("E. One-Page Commercial Summary",
  subtitle: "Internal circulation only · Not a legally binding agreement")

#set text(size: 9pt)

#table(
  columns: (1.5fr, 3fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if calc.odd(y) { surface } else { none },
  strong[Vendor], [[VENDOR NAME], [ADDRESS]],
  strong[Customer], [[CUSTOMER NAME], [ADDRESS]],
  strong[Product], [[PRODUCT NAME] --- [one-line description]],
)

#v(0.8em)
#text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 0.8pt, upper("Commercial Terms"))
#v(0.3em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.4em)

#table(
  columns: (2fr, 3fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if calc.odd(y) { surface } else { none },
  strong[Annual Contract Value (ACV)], [£[AMOUNT]],
  strong[Payment terms], [Annual in advance],
  strong[Invoice date], [On contract execution],
  strong[Contract start date], [[DATE]],
  strong[Initial term], [[1 / 2 / 3] year(s)],
  strong[Auto-renewal], [Yes --- renews automatically for 1-year terms],
  strong[Notice to prevent renewal], [60 days before renewal date],
  strong[Price increase on renewal], [Capped at [5% / CPI]],
)

#v(0.8em)
#text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 0.8pt, upper("Scope"))
#v(0.3em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.4em)

#table(
  columns: (2fr, 3fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if calc.odd(y) { surface } else { none },
  strong[Authorised users], [[NUMBER]],
  strong[Included modules], [[LIST]],
  strong[Excluded / add-ons], [[LIST or "None"]],
  strong[Implementation support], [[Included / [NUMBER] days at no charge]],
)

#v(0.8em)
#text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 0.8pt, upper("Key Contacts"))
#v(0.3em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.4em)

#table(
  columns: (1.5fr, 2fr, 2fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Role]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Vendor]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Customer]),
  strong[Commercial], [[NAME], [EMAIL]], [[NAME], [EMAIL]],
  strong[Technical], [[NAME], [EMAIL]], [[NAME], [EMAIL]],
  strong[Billing], [[NAME], [EMAIL]], [[NAME], [EMAIL]],
)

#v(0.8em)
#text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 0.8pt, upper("Next Steps"))
#v(0.3em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.4em)

#table(
  columns: (2.5fr, 1.5fr, 1.5fr),
  stroke: none,
  inset: (x: 0.65em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Step]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Owner]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Date]),
  [Order Form sent], [Vendor], [[DATE]],
  [Legal review complete], [Customer], [[DATE]],
  [Contract signed], [Both], [[DATE]],
  [Access provisioned], [Vendor], [[DATE]],
)

#set text(size: 10.5pt)
#v(2em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.5em)
#align(center,
  text(size: 8.5pt, fill: muted, style: "italic",
    "Questions? Contact [VENDOR COMMERCIAL CONTACT] at [EMAIL] or [PHONE]."
  )
)

// ── F. Negotiation Preparation Worksheet ─────────────────────────────────────
#appendix-doc("F. Negotiation Preparation Worksheet",
  subtitle: "Complete before any commercial negotiation above £50k ACV")

#set text(size: 9.5pt)

Use this worksheet to prepare for any significant commercial negotiation. Complete it before the meeting, share it with your War Room team, and use it to run the red team challenge. A deal negotiated without this preparation will produce worse outcomes than one negotiated with it.

#v(0.6em)
#text(size: 8pt, fill: muted, font: "Gill Sans", tracking: 0.8pt, upper("Deal context"))
#v(0.3em)
#line(length: 100%, stroke: 0.4pt + muted.lighten(40%))
#v(0.4em)

#grid(
  columns: (1fr, 1fr),
  gutter: 1em,
  {
    text(weight: "bold", "Customer: ") + " " * 20 + "_"
    linebreak()
    v(0.6em)
    text(weight: "bold", "Deal name: ") + " " * 19 + "_"
    linebreak()
    v(0.6em)
    text(weight: "bold", "Deal owner: ") + " " * 18 + "_"
  },
  {
    text(weight: "bold", "Date of negotiation: ") + " " * 10 + "_"
    linebreak()
    v(0.6em)
    text(weight: "bold", "Current proposed ACV: ") + " " * 9 + "_"
    linebreak()
    v(0.6em)
    text(weight: "bold", "Counterparts in room: ") + " " * 9 + "_"
  }
)

#v(0.8em)
#appendix-section("1. Our BATNA")
#text(size: 8.5pt, style: "italic", fill: muted)[What is our best alternative if this deal does not close? List the next-best live opportunities at similar or greater ACV.]

#v(3.5cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#v(0.6em)
#text(size: 8.5pt)[*BATNA strength:* ] #box(stroke: 0.5pt + muted, inset: 4pt, radius: 2pt)[Strong] #h(0.5em) #box(stroke: 0.5pt + muted, inset: 4pt, radius: 2pt)[Moderate] #h(0.5em) #box(stroke: 0.5pt + muted, inset: 4pt, radius: 2pt)[Weak]

#v(0.3em)
#text(size: 8pt, fill: muted, style: "italic")[A weak BATNA means you will make concessions you should not make. Address pipeline coverage before the meeting if possible.]

#appendix-section("2. Their BATNA")
#text(size: 8.5pt, style: "italic", fill: muted)[What happens to them if this deal does not close? What is driving their timeline? What are the alternatives — build, buy from a competitor, do nothing?]

#v(3.5cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#appendix-section("3. Our Walk-Away Point")
#text(size: 8.5pt, style: "italic", fill: muted)[The minimum terms at which this deal is worth doing. Be specific. Below this point, we say no.]

#table(
  columns: (2fr, 1fr, 1.5fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Parameter]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Walk-away threshold]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Notes]),
  [Minimum ACV], [], [],
  [Minimum contract length], [], [],
  [Maximum implementation commitment], [], [],
  [Payment terms (minimum)], [], [],
  [SLA floor], [], [],
  [Other: ], [], [],
)

#appendix-section("4. Our Anchor Position")
#text(size: 8.5pt, style: "italic", fill: muted)[The opening position we intend to state. It should be ambitious but defensible with reference to value delivered.]

#table(
  columns: (2fr, 1fr, 2fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Item]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Anchor]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Rationale to state]),
  [ACV], [], [],
  [Contract length], [], [],
  [Payment terms], [], [],
  [Implementation scope], [], [],
  [Other], [], [],
)

#appendix-section("5. Trade List")
#text(size: 8.5pt, style: "italic", fill: muted)[What are we willing to move on, in what sequence, and what do we ask for in return? What are we not willing to move on?]

#table(
  columns: (2fr, 1.5fr, 1.5fr, 1fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Item we can give]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Limit]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Condition (ask in return)]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Priority]),
  [], [], [], [],
  [], [], [], [],
  [], [], [], [],
  [], [], [], [],
  [], [], [], [],
)

#v(0.5em)
*Items we will not move on (and why):*

#v(2.5cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#appendix-section("6. Anticipated Objections")
#text(size: 8.5pt, style: "italic", fill: muted)[What objections do we expect, and how will we respond?]

#table(
  columns: (2fr, 1fr, 2.5fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Objection]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Type (signal/decision)]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Our response]),
  [Price is too high], [], [],
  [Need a longer pilot], [], [],
  [Competitor is cheaper], [], [],
  [Need board approval first], [], [],
  [], [], [],
  [], [], [],
)

#appendix-section("7. Red Team Challenge")
#text(size: 8.5pt, style: "italic", fill: muted)[To be completed by someone not on the deal team before the negotiation. One question: what is the most likely reason this deal does not close on terms we can accept?]

#v(4cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#v(0.3em)
#text(size: 8.5pt)[*Red team response from deal team:*]
#v(3cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#appendix-section("8. Post-Negotiation Concession Log")
#text(size: 8.5pt, style: "italic", fill: muted)[Complete after the negotiation. Track every concession made and what was received in return. Use this to improve the next negotiation.]

#table(
  columns: (0.5fr, 2fr, 2fr, 2fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[\#]),
  table.cell(stroke: (bottom: 1pt + accent), strong[We gave]),
  table.cell(stroke: (bottom: 1pt + accent), strong[We received]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Notes]),
  [1], [], [], [],
  [2], [], [], [],
  [3], [], [], [],
  [4], [], [], [],
  [5], [], [], [],
)

#v(0.6em)
*Final agreed terms:*

#table(
  columns: (2fr, 1fr),
  stroke: none,
  inset: (x: 0.6em, y: 0.5em),
  fill: (x, y) => if y == 0 { none } else if calc.odd(y) { surface } else { none },
  table.cell(stroke: (bottom: 1pt + accent), strong[Parameter]),
  table.cell(stroke: (bottom: 1pt + accent), strong[Agreed value]),
  [ACV], [],
  [Contract length], [],
  [Payment terms], [],
  [Implementation scope], [],
  [Go-live date], [],
  [Other], [],
)

#v(0.8em)
*What we will do differently in the next negotiation:*

#v(3cm)
#line(length: 100%, stroke: 0.4pt + muted.lighten(60%))

#set text(size: 10.5pt)

#v(3em)
#align(center, {
  line(length: 20%, stroke: 0.5pt + muted)
  v(0.8em)
  text(size: 8pt, fill: muted, style: "italic", "End of Salient: Enterprise Selling for STEM Founders")
})
