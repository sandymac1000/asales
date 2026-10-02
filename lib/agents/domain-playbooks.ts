export type Vertical =
  | "aerospace_defence"
  | "pharma_biotech"
  | "financial_services"
  | "energy_utilities"
  | "healthcare"
  | "manufacturing"
  | "fintech"
  | "government"
  | "software_technology";

interface Playbook {
  label: string;
  keywords: string[];
  content: string;
}

const PLAYBOOKS: Record<Vertical, Playbook> = {
  aerospace_defence: {
    label: "Aerospace & Defence",
    keywords: [
      "aerospace", "defence", "defense", "boeing", "airbus", "spacex", "lockheed",
      "rolls-royce", "rolls royce", "bae", "northrop", "mro", "avionics", "satellite",
      "rocket", "drone", "uav", "aerostructure", "propulsion", "airframe", "do-178",
      "do-254", "itar", "cmmc", "dtib", "easa", "faa certification",
    ],
    content: `DOMAIN: Aerospace & Defence

ECONOMIC BUYERS — typical titles and what they are measured on:
- VP Engineering / Head of Engineering: programme delivery on time and on budget, technical risk reduction
- Chief Digital Officer (CDO) / Head of Digital Transformation: digital thread maturity, cost per engineering hour
- CTO: technology roadmap execution, IP protection
- Head of MRO / VP Aftermarket: cost per flight hour, unscheduled maintenance events, AOG (Aircraft on Ground) time
- Programme Director: programme margin, milestone compliance, certification timelines

PAIN TRIGGERS — what creates urgency:
- MRO unscheduled maintenance: each AOG event costs £200k–£500k+ for a commercial operator; predictive maintenance directly attacks this
- Certification bottleneck: DO-178C / DO-254 / EASA CS-25 compliance slows every software programme; anything that accelerates qualification evidence generation has immediate ROI
- Digital thread fragmentation: engineering data lives across Siemens NX, PTC Windchill, Dassault CATIA, and bespoke databases — data duplication and version errors cause programme delays
- Supply chain visibility: single-source dependencies exposed post-COVID drive investment in supplier risk tooling
- ITAR/export control compliance cost: managing access controls manually is expensive and error-prone

BUDGET & PROCUREMENT:
- Budget is tied to specific programmes (e.g., A320neo MRO programme, F-35 sustainment), not general IT budgets
- Multi-year commitments common; CAPEX-heavy environment
- Procurement: ITAR compliance required for US-origin technology, DTIB (Defence and Technology Industrial Base) for UK MoD, JSP 440 (UK security), CMMC Level 2–3 for US DoD supply chain
- Cyber Essentials Plus is minimum bar for UK defence primes
- Expect 6–18 months procurement; pre-qualify to frameworks (DEF STAN, G-Cloud, Crown Commercial) where possible
- Sole-source justification possible on niche technical capability — document your differentiation

CHAMPION PROFILE — real vs fan:
- Real champion: Programme digital lead, Head of MRO Technology, or Digital Engineering manager with a budget line and a direct reporting line to CDO or CTO
- They have previously delivered a digital programme and know the organisation's approval process
- Fan: a junior engineer or analyst who finds the technology exciting but has no budget authority and no C-suite sponsor
- Red flag: champion who hasn't arranged a meeting with the CDO or CTO after 3+ conversations

BUILD VS BUY:
- Primes (Boeing, Airbus, BAE, Lockheed) have large internal digital engineering teams and will evaluate build seriously
- Make-vs-buy case must quantify: build cost (often 3–5× underestimated by engineering teams), maintenance burden, time-to-value gap, opportunity cost of internal resource
- Key differentiator: your domain data, pre-built integrations to PLM/MRO systems (Siemens, SAP IAM, IFS), or certification evidence that internal teams would need to regenerate

REAL COMPETITION:
- Existing PLM vendors: PTC (Windchill/ServiceMax), Siemens (Teamcenter/Opcenter), Dassault (ENOVIA/EXALEAD) — all claim MRO/digital thread capability
- IBM Maximo, SAP PM for maintenance management
- Internal digital teams (engineering-led build)
- Do-nothing / Excel + SharePoint (more common than it should be)

CULTURAL NORMS:
- Conservative, risk-averse; relationships matter over slides
- Technical credibility must be established before commercial conversations start
- Reference customers in the same tier (Tier 1 prime vs Tier 2 supplier) carry disproportionate weight
- Security clearance or equivalent may be required for sensitive programmes
- Decisions take time; short-term pressure tactics backfire

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: one-way NDA (usually in the prime's favour), export control / ITAR annexes, DEF STAN and AS9100 flow-downs, a Long Term Agreement with call-off Statements of Work tied to programme milestones
- Fought over: ownership of foreground IP developed under programme funding, Crown or Government march-in rights, liability where anything touches airworthiness, data rights over test results, who carries export-control responsibility
- Cheap to concede: escrow, restricting field of use to a named platform or programme (you were not serving the others anyway), territory limits that export control already imposes
- Expensive, however it is dressed: any liability tied to airworthiness or flight safety, and foreground IP that silently absorbs your background IP
- The trap: primes flow down the terms they accepted from the MoD or DoD. You can find yourself signing government terms without ever having negotiated with a government. Schedule your background IP explicitly or it will be treated as foreground.

KEY TERMINOLOGY: AOG, MRO, digital thread, PLM, PDM, configuration management, airworthiness, DO-178C, DO-254, EASA, FAA, ITAR, DTIB, Cyber Essentials, CMMC, programme manager, chief engineer, design authority, AS9100`,
  },

  pharma_biotech: {
    label: "Pharma & Biotech",
    keywords: [
      "pharma", "pharmaceutical", "biotech", "drug", "clinical trial", "cro", "fda",
      "ema", "gxp", "gmp", "gcp", "glp", "molecule", "therapeutic", "regulatory submission",
      "iqvia", "covance", "pra", "syneos", "parexel", "pipeline", "phase ii", "phase iii",
      "clinical data", "ctms", "edcs", "edc", "randomisation", "biomarker", "preclinical",
      "nda", "bla", "maa", "510k", "pma", "ich", "21 cfr", "annex 11",
    ],
    content: `DOMAIN: Pharma & Biotech / Life Sciences

ECONOMIC BUYERS — typical titles and what they are measured on:
- Head of Digital / Chief Digital Officer: digital transformation programme delivery, cost per trial, time-to-market
- CSO (Chief Scientific Officer): pipeline velocity, R&D productivity, data quality for regulatory submissions
- VP R&D / Head of Research: experiment throughput, data reproducibility, IP protection
- VP Clinical Operations / Head of Clinical Development: trial timeline, site activation speed, protocol deviation rate
- CTO (where IT-adjacent): system reliability, GxP validation compliance, integration capability
- For CROs: COO or Head of Operations focused on margin and client retention

PAIN TRIGGERS — what creates urgency:
- Phase II/III trial failure: costs £50M–£500M per failed drug; AI-driven patient selection or biomarker identification that improves Phase II success rate has enormous ROI
- Regulatory submission timelines: a Complete Response Letter (CRL) from FDA costs £1M–£5M/day in lost market exclusivity; data quality and submission readiness tools address this directly
- GxP compliance data integrity: 21 CFR Part 11 (US) and EU Annex 11 require validated audit trails for all regulated data — manual processes fail inspections
- R&D productivity gap: big pharma spends £2–3B on average to bring a drug to market; anything that reduces failed experiments or speeds lead identification has compounding value
- CRO competitive pressure: CROs compete on delivery speed and quality; technology that reduces site monitoring costs or improves data clean rates is margin-improving

BUDGET & PROCUREMENT:
- Big pharma: budget tied to specific drug programmes, not general IT — align the sale to a named compound or therapeutic area
- CROs: OpEx budget, often faster to move than big pharma; procurement driven by client requirements
- Validated systems requirement (IQ/OQ/PQ): every system touching regulated data must be validated — budget time and cost for this or it will stall your deal
- Vendor qualification: pharma companies qualify vendors (audit, quality agreement, security review) — expect 3–12 months for full qualification
- Data privacy: HIPAA (patient data, US), GDPR (EU/UK), ICH E6(R3) GCP — contracts must include Data Processing Agreements

CHAMPION PROFILE — real vs fan:
- Real champion: Head of Informatics, Digital Lab Lead, or Clinical Data Scientist who has previously delivered a validated system and navigated a regulatory inspection
- They understand GxP implications and can translate your product into the language of the quality team
- Fan: a data scientist or research associate who loves the technology but has never managed a validation project and doesn't know the procurement process
- Red flag: EB is the IT department rather than the scientific or clinical function — IT in pharma is often a procurement gatekeeper, not a business champion

BUILD VS BUY:
- Large pharma increasingly prefers to buy (internal build is slow and requires validated development processes)
- CROs almost always buy — they lack engineering headcount to build
- Buy case: emphasise pre-validated status (if applicable), regulatory track record, time-to-value vs internal build timelines, and the vendor's GxP expertise as part of the product

REAL COMPETITION:
- Established LIMS/EDC vendors: Veeva Vault (dominant in clinical), Medidata (Rave), Oracle Clinical, PAREXEL Medidata
- SAS and R for statistical analysis (deeply embedded, hard to displace)
- Internal bioinformatics teams (especially at top-10 pharma)
- Do-nothing / spreadsheet-based data management

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: mutual NDA (time-limited, typically three to five years), Material Transfer Agreement, Quality Agreement covering GxP responsibilities, MSA with Work Orders, DPA, and for anything licensed a full agreement with milestones and royalties
- Fought over: ownership of results and improvements, publication rights, field of use by indication, territory, the milestone and royalty structure, audit rights, data ownership and the provenance of patient consent, and who bears the cost of IQ/OQ/PQ validation
- Cheap to concede: publication rights to an academic partner, validation support (which is usually chargeable work rather than a giveaway), audit rights you would pass anyway
- Expensive, however it is dressed: field of use narrowed to a single indication, which looks modest and removes most of your market; any assignment of improvements
- The trap: an MTA signed early, before anyone knows what the material will produce, can assign rights to results you have not yet imagined. Read it as a licensing agreement, because that is what it becomes.

KEY TERMINOLOGY: GxP, GMP, GCP, GLP, IQ/OQ/PQ, 21 CFR Part 11, Annex 11, audit trail, validated system, CTMS, EDC, LIMS, regulatory submission, NDA, BLA, MAA, clinical data management, protocol deviation, site activation, pharmacovigilance, IDMC, DSMB`,
  },

  financial_services: {
    label: "Financial Services",
    keywords: [
      "bank", "banking", "insurance", "asset management", "hedge fund", "capital markets",
      "trading", "finra", "fca", "pra", "basel", "solvency", "aum", "risk", "compliance",
      "underwriting", "actuarial", "clearing", "settlement", "custody", "aml", "kyc",
      "credit risk", "operational risk", "market risk", "liquidity", "regulatory capital",
      "stress testing", "ifrs", "iasb", "fsb", "srep", "icaap", "ilaap",
    ],
    content: `DOMAIN: Financial Services (Banking, Insurance, Asset Management)

ECONOMIC BUYERS — typical titles and what they are measured on:
- CTO / CIO: technology reliability, cost reduction, regulatory compliance, tech debt reduction
- CDO (Chief Data Officer): data quality, regulatory reporting accuracy, model risk management
- CRO (Chief Risk Officer): regulatory capital efficiency, operational risk incidents, model validation timelines
- COO / Head of Operations: cost-to-income ratio, operational efficiency, straight-through processing rate
- CFO: cost of compliance, cost-to-serve per customer, regulatory capital ratios
- Head of Compliance / MLRO: regulatory breach incidents, AML/KYC throughput, regulatory exam outcomes

PAIN TRIGGERS — what creates urgency:
- Regulatory obligation: FCA/PRA supervisory requirement, DORA (EU Digital Operational Resilience Act), Basel IV capital calculations — compliance deadlines create non-negotiable urgency
- Operational risk events: each major incident triggers regulatory reporting, Board-level scrutiny, and potential fine — prevention or faster detection has clear ROI
- Manual reconciliation cost: T+2 settlement risk in capital markets, manual breaks in fund accounting — each FTE processing breaks costs £45k–£70k/year
- Model validation backlog: PRA/FCA requires independent model validation for all risk models; validation costs £500k–£1M per model per year; automation cuts this significantly
- UK banks spend 10–15% of total revenue on compliance — any reduction has direct impact on cost-to-income ratio

BUDGET & PROCUREMENT:
- Annual OpEx budget cycle; most decisions made in Q3–Q4 for following year
- Per-vendor spend thresholds: typically £100k (manager), £500k (Director/MD), £1M+ (ExCo/Board)
- Procurement: FCA/PRA Third Party Risk Management (SS2/21), DORA Article 28 due diligence, operational resilience testing requirements
- Cyber due diligence: SOC 2 Type II, ISO 27001, pen test reports, business continuity plan — all required before contract
- Expected timeline: 6–18 months for significant technology contracts; sub-£100k OpEx can move in 6–8 weeks
- Preferred route: Master Services Agreement first, then Order Forms — standard commercial MSA negotiation is 8–12 weeks

CHAMPION PROFILE — real vs fan:
- Real champion: a risk or operations lead who has previously implemented a regulated technology solution and has an existing relationship with the CRO, COO, or CTO
- They know the procurement and third-party risk process intimately and will proactively pull it forward
- Fan: a quant analyst, data scientist, or junior risk manager who likes the technology but has no budget authority and no executive sponsor
- Red flag: champion is in IT rather than risk/business/compliance; IT in financial services often has veto power but rarely championing power

BUILD VS BUY:
- Large banks (Tier 1 and 2) have significant internal engineering capability and default to build for competitive differentiation
- Make-vs-buy case must address: internal build timeline (typically 3–5× longer than estimated), maintenance burden, regulatory validation cost of internal builds, and the risk of key-person dependency
- Tier 3+ banks and insurers typically prefer to buy; CIOs have smaller teams and limited capacity
- Asset managers and hedge funds move fastest — lean teams, performance-focused, willing to pay for edge

REAL COMPETITION:
- Incumbent vendors: SS&C, Broadridge, Temenos (banking core), Guidewire (insurance), BlackRock Aladdin (asset management)
- Big 4 consulting-led builds (Accenture, Deloitte wrapping open-source)
- Internal quant/engineering teams (especially Tier 1 banks)
- Do-nothing: regulatory pressure sometimes forces action, but "wait and see" is common until a breach occurs

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: MSA, DPA, a regulatory outsourcing schedule (EBA guidelines, PRA SS2/21 operational resilience), a documented exit plan, security schedule, business continuity and testing obligations
- Fought over: the regulator's right of access and audit, step-in rights, exit and transition assistance, data residency, sub-processor change control, liability for a data breach, and service credits
- Cheap to concede: regulator audit and access rights, which are not actually yours to refuse; transition assistance, which is chargeable; reporting and evidence obligations you already produce
- Expensive, however it is dressed: uncapped breach liability, data residency that forces new infrastructure, and step-in rights drafted broadly enough to hand over your systems
- The trap: if the engagement is classified as material outsourcing, a far heavier contractual regime applies. It is sometimes possible to scope the work so it is not — and that conversation is worth having before the paperwork starts, not after.

KEY TERMINOLOGY: cost-to-income ratio, T+2 settlement, straight-through processing (STP), model risk, operational risk, regulatory capital, ICAAP, ILAAP, SREP, FCA/PRA, DORA, Basel IV, Solvency II, AML/KYC, RWA, NPA, Sharpe ratio, VAR, stress testing, conduct risk`,
  },

  energy_utilities: {
    label: "Energy & Utilities",
    keywords: [
      "energy", "oil", "gas", "renewable", "wind", "solar", "grid", "utility", "ofgem",
      "ofwat", "sse", "bp", "shell", "national grid", "upstream", "downstream", "esg",
      "net zero", "mw", "gwh", "kwh", "substation", "transmission", "distribution",
      "smart grid", "scada", "ems", "dms", "oee", "asset management", "reliability",
      "predictive maintenance", "carbon", "scope 1", "scope 2", "scope 3", "decarbonisation",
    ],
    content: `DOMAIN: Energy & Utilities

ECONOMIC BUYERS — typical titles and what they are measured on:
- CTO / CDTO (Chief Digital & Technology Officer): digital transformation delivery, technology cost reduction, OT/IT convergence
- VP Operations / Head of Operations: asset reliability (OEE, MTBF, MTTR), unplanned downtime incidents, safety events
- Head of Digital / Digital Transformation Director: programme delivery, use case velocity, business case realisation
- CFO: CAPEX/OPEX ratio, regulatory return (RIIO-2 for UK networks), ESG reporting accuracy
- Head of Sustainability / Chief Sustainability Officer: scope 1/2/3 accuracy, net zero trajectory, regulatory compliance
- For upstream oil & gas: VP Asset Management, Head of Production, HSE Director

PAIN TRIGGERS — what creates urgency:
- Unplanned downtime: each outage costs £50k–£500k/hour for a gas-fired power plant, or millions/hour for upstream production; predictive maintenance directly attacks this
- Net zero and ESG reporting: Ofgem, Ofwat, and FCA (TCFD) require accurate carbon reporting; manual data collection is expensive and error-prone under regulatory scrutiny
- Energy transition complexity: grid balancing with intermittent renewables costs UK National Grid £1.5B+/year; forecasting and optimisation tools have direct £ value
- Asset lifecycle management: large networks have 20,000–50,000+ assets; manual inspection and maintenance planning creates safety risk and regulatory exposure
- Water/energy leakage: Ofwat sets leakage targets; automated detection saves both product loss and penalty risk

BUDGET & PROCUREMENT:
- CAPEX-heavy sector — try to position as part of a capital investment programme (e.g., smart grid upgrade, asset replacement cycle) rather than OpEx
- Regulatory investment cycles: Ofgem (electricity), Ofwat (water), and equivalent regulators set multi-year price controls (RIIO-2, PR24) — investments need to tie to regulatory commitment or justified as efficiency improvements
- Procurement: ISO 55001 (asset management) supplier requirements, Cyber Essentials Plus for OT-adjacent systems, HSE Management of Change process, NIS Regulations compliance for critical infrastructure
- Expect 6–24 months; large CAPEX programmes require Board approval and often regulatory justification
- Framework contracts: Crown Commercial (public sector), Achilles UVDB (utilities), Achilles BuildingConfidence (construction)

CHAMPION PROFILE — real vs fan:
- Real champion: Head of Asset Performance, Digital Programme Manager, or Head of Innovation who has budget authority or a direct reporting line to the CDTO/VP Operations
- They have previously delivered a technology project through the Management of Change process
- Fan: an engineer or data analyst who sees the value but has no budget, no executive sponsor, and has never navigated the procurement process
- Red flag: the buying conversation is led by procurement before the operational business case is established

BUILD VS BUY:
- Large integrated utilities (National Grid, SSE, BP, Shell) have digital engineering teams and will evaluate build
- Make-vs-buy case should emphasise: domain-specific training data your product has that they lack, time-to-value (their build estimates are typically 3–5× optimistic), and regulatory/safety risk of bespoke builds in OT environments
- OT/IT convergence is a key tension — your positioning relative to SCADA/DMS/ADMS vendors (ABB, Schneider, GE Vernova, Siemens) matters

REAL COMPETITION:
- OT vendors extending into software: ABB, Schneider Electric, GE Vernova, Siemens Energy, Honeywell
- IBM Maximo / SAP PM for asset management
- Specialist SCADA/EMS vendors (OSIsoft/AVEVA PI, AspenTech)
- Internal digital engineering teams (especially at BP, Shell, National Grid)
- McKinsey/Accenture-led transformation programmes that wrap commodity tools

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: framework agreement with call-offs, often an NEC or FIDIC form inherited from capital projects, HSE annexes, OT and ICS security schedules referencing IEC 62443, and long-term service agreements
- Fought over: liquidated damages tied to availability, liability for operational disruption, cyber requirements reaching into operational technology, IP in site-specific configuration, change control, and retention or milestone-based payment
- Cheap to concede: IP in site-specific configuration, extended support hours, evidence and reporting obligations
- Expensive, however it is dressed: liquidated damages against availability, and any indemnity for consequential loss arising from an outage — a single incident can exceed the contract value many times over
- The trap: contract forms designed for construction get applied to software, bringing retentions, milestone payments and defect liability periods with them. For a small vendor that is a cash-flow problem long before it is a legal one.

KEY TERMINOLOGY: OEE, MTBF, MTTR, SCADA, EMS, DMS, ADMS, smart grid, predictive maintenance, condition monitoring, asset health index, RIIO-2, PR24, Ofgem, Ofwat, NIS Regulations, Management of Change, HAZOP, LOTO, net zero, scope 1/2/3, carbon intensity`,
  },

  healthcare: {
    label: "Healthcare",
    keywords: [
      "nhs", "hospital", "health system", "ehr", "ehrs", "epic", "meditech", "clinical",
      "gp", "pharmacy", "diagnostic", "radiology", "patient pathway", "ict", "cerner",
      "dna", "ccg", "icb", "integrated care", "primary care", "secondary care",
      "patient safety", "waiting list", "rtt", "bed management", "discharge", "a&e",
      "emergency department", "dtac", "dsp toolkit", "ig toolkit", "nhse", "nhsx",
    ],
    content: `DOMAIN: Healthcare (NHS, Hospital Groups, Diagnostics)

ECONOMIC BUYERS — typical titles and what they are measured on:
- CTO / CCIO (Chief Clinical Information Officer): system stability, EPR adoption, digital maturity score, clinical safety incidents
- CFO: QIPP savings (Quality, Innovation, Productivity and Prevention), cost per patient episode, agency staff spend
- COO / Chief Operating Officer: waiting times (RTT 18-week target), bed utilisation, discharge flow, A&E 4-hour standard
- Medical Director: clinical safety, quality metrics, patient outcomes, clinical staff satisfaction
- Director of Digital: digital transformation programme delivery, NHSE digital aspirant / frontrunner status, DTAC compliance

PAIN TRIGGERS — what creates urgency:
- Waiting list backlash: NHS RTT 18-week target breaches trigger NHS England oversight, Board scrutiny, and potential CQC concerns; tools that improve pathway throughput have direct regulatory value
- Agency staff cost: NHS spent £6B+ on agency/locum staff in 2023/24; anything that reduces agency dependency through better rostering, demand forecasting, or skill gap analysis has immediate CFO interest
- Diagnostic backlog: post-COVID imaging and pathology backlogs are a national priority; AI-assisted reporting or worklist triage accelerates throughput with existing headcount
- EPR implementation: all NHS Trusts are now expected to have a fully functional EPR by 2025/26; integration, workflow optimisation, and clinical decision support around the EPR are in-scope
- Patient safety incidents: each Never Event or serious patient safety incident triggers a root cause analysis and Board report; prevention tools have a compelling safety case

BUDGET & PROCUREMENT:
- NHS QIPP: align your value case to a named QIPP target or efficiency programme — this is how the CFO justifies OpEx spend
- NHSE digital investment: NHS England Frontrunner and Digital Aspirant programmes provide capital funding for technology — check if the Trust is in a programme
- Procurement routes: NHS Shared Business Services (SBS), NHS Supply Chain, G-Cloud 14 (software services must be on framework), Dynamic Purchasing System
- DTAC (Digital Technology Assessment Criteria): mandatory for clinical software — assess against all 10 criteria before engaging clinical users, or your deal will stall at governance
- DSP Toolkit and IG Toolkit: data security compliance mandatory; Cyber Essentials mandatory from 2024
- Timeline: 6–24 months typical; sub-£100k SaaS on G-Cloud can move in 3–6 months; EPR-adjacent projects require Caldicott Guardian, SIRO, and IG sign-off

CHAMPION PROFILE — real vs fan:
- Real champion: CCIO or a clinical lead (Consultant or Nurse Consultant) who has previously delivered a digital programme and has a direct relationship with the Medical Director and CFO
- They understand DTAC, can navigate clinical safety sign-off (DCB0129/DCB0160), and have already secured a clinical governance slot
- Fan: a junior analyst, informatics manager, or enthusiastic junior doctor who sees clinical value but has no authority and has never navigated procurement
- Red flag: champion is non-clinical IT without a clinical sponsor — clinical safety governance will block the deal at a later stage

BUILD VS BUY:
- NHS almost never builds bespoke software (lack of in-house engineering teams); but existing EPR vendors (Epic, Cerner, System C) claim to solve every adjacent problem
- Key positioning: demonstrate capability that the EPR cannot deliver, certified DTAC compliance, and integration with the specific EPR in use at the Trust
- GDE/GPDPR-compliant data architecture is table stakes

REAL COMPETITION:
- EPR vendors extending into analytics and AI: Epic App Orchard, Cerner PowerInsight, System C
- Established NHS analytics platforms: Civica, Allocate, NHS Benchmarking Network, IQVIA for real-world evidence
- Microsoft (Azure Health Data Services) and AWS (HealthLake) as cloud infrastructure bids
- "Digital aspirant" consultancy-led projects (Optum, Deloitte) that wrap commodity tools

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: the NHS Standard Contract or a provider's equivalent, DPA, Data Security and Protection Toolkit submission, DTAC assessment, a clinical safety case under DCB0129 with the Trust's own under DCB0160, information governance schedules, and often a G-Cloud call-off
- Fought over: who carries clinical safety responsibility, controller versus processor status, interoperability obligations, exit and data portability, and liability for clinical harm
- Cheap to concede: data portability and exit assistance, interoperability commitments you intended to build anyway, transparency over incident reporting
- Expensive, however it is dressed: accepting the manufacturer role in the clinical safety case without the resource to discharge it, and liability for clinical decisions taken by clinicians using your output
- The trap: DTAC and DSPT are entry tickets, not bargaining chips — begin them before the deal needs them. Clinical safety duties under DCB0129 cannot be contracted away, whatever the contract says.

KEY TERMINOLOGY: RTT, QIPP, CQUIN, EPR, CCIO, SIRO, Caldicott Guardian, DTAC, DCB0129, DCB0160, IG Toolkit, DSP Toolkit, G-Cloud, NHS SBS, ICB, PCN, integrated care, Never Event, Serious Incident, bed utilisation, discharge pathway`,
  },

  manufacturing: {
    label: "Manufacturing & Industrials",
    keywords: [
      "manufacturing", "factory", "oee", "production", "assembly", "supply chain",
      "scm", "erp", "sap", "mes", "plc", "scada", "lean", "six sigma", "automotive",
      "tier 1", "tier 2", "just in time", "kanban", "andon", "kaizen", "downtime",
      "quality", "defect", "ppm", "yield", "throughput", "changeover", "smed",
      "predictive maintenance", "condition monitoring", "iiot", "industry 4.0",
    ],
    content: `DOMAIN: Manufacturing & Industrials

ECONOMIC BUYERS — typical titles and what they are measured on:
- VP Manufacturing / Head of Manufacturing: OEE (Overall Equipment Effectiveness), throughput, on-time delivery, scrap rate
- COO / Chief Operating Officer: overall plant profitability, cost per unit produced, working capital efficiency
- Head of Operations / Plant Director: site P&L, safety record (RIDDOR), labour productivity
- CTO / Head of Engineering: technical capability, R&D-to-production transfer speed, IP protection
- Head of Procurement / Supply Chain Director: supplier on-time delivery, inventory turns, supply chain risk events

PAIN TRIGGERS — what creates urgency:
- Unplanned downtime: each hour of downtime on an automotive press line costs £5k–£50k; at a continuous process plant (pharma, food) costs can exceed £100k/hour; predictive maintenance with clear ROI is compelling
- Quality escapes: a customer recall in automotive costs £10M–£100M+; quality detection at source (not end-of-line) is a mandatory investment when a recall has just occurred
- OEE gap: world-class OEE is 85%; most plants run at 60–70%; a 5% OEE improvement on a £100M revenue plant is worth £5M/year — frame your ROI here
- Supply chain disruption: post-COVID single-source dependency is a Board-level concern; supply chain visibility and risk tools are now in every Tier 1 supplier's roadmap
- IATF 16949 audit: automotive quality management system audit creates urgency for digital quality records and traceability

BUDGET & PROCUREMENT:
- Investment tied to plant CAPEX cycles or OPEX improvement programmes — ROI on OEE is immediate and calculable, making CFO approval faster than abstract digital transformation
- Automotive OEMs drive investment through their supply chain: a Tier 1 supplier receiving a quality directive from BMW/Mercedes/Toyota will invest to avoid losing the contract
- Procurement: ISO 9001 supplier qualification, IATF 16949 (automotive), AS9100 (aerospace supply chain), IEC 62443 (cybersecurity for OT networks)
- OT network security is a growing requirement — ensure your product's network requirements are documented for the IT/OT security team
- Expected timeline: 3–9 months; pilot at a single plant, then roll-out

CHAMPION PROFILE — real vs fan:
- Real champion: Head of Manufacturing IT, Digital Transformation Lead, or a Plant Engineering Manager who has operational budget authority or a direct line to the COO/Plant Director
- They have previously delivered a plant-floor technology project and know the Management of Change process
- Fan: a maintenance technician, process engineer, or data analyst who sees the value but has no budget and no executive sponsor
- Red flag: the sale is being driven by IT rather than the manufacturing function — IT in manufacturing often doesn't have the operational authority to drive deployment on the plant floor

BUILD VS BUY:
- Large manufacturers (Rolls-Royce, GKN, JLR) have internal digital engineering teams and will evaluate build; position around domain expertise and integration depth
- Tier 2/3 suppliers almost always buy — they lack engineering headcount
- Make-vs-buy case: emphasise pre-built MES/SCADA integrations, domain-trained models, and the time-to-value gap vs internal build; internal builds for plant-floor software typically take 18–36 months

REAL COMPETITION:
- MES vendors extending into AI: Siemens Opcenter, Rockwell FactoryTalk, AVEVA, Honeywell Forge
- Incumbent ERP (SAP ME, SAP S/4 PM) claiming to solve the maintenance/quality problem
- PTC ThingWorx / Kepware (IIoT platform layer)
- OSIsoft/AVEVA PI for historian and process data
- Internal Industry 4.0 teams at large manufacturers

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: the customer's standard purchase order terms (which frequently override whatever you sent), a supply agreement, a quality agreement under IATF 16949 or ISO 9001, tooling and equipment ownership terms, and an NDA
- Fought over: liability for line stoppage, warranty duration, spare parts and support commitments, IP in process improvements, and annual price-down clauses
- Cheap to concede: extended warranty, longer support commitments, IP in improvements specific to their line
- Expensive, however it is dressed: liability for production stoppage, and annual cost-reduction clauses, which look reasonable at signature and remove your margin a percentage point at a time over five years
- The trap: the battle of the forms. Ship against their purchase order without countering and their terms govern, no matter what your MSA says. Settle which document rules before the first delivery, not after the first dispute.

KEY TERMINOLOGY: OEE, MTBF, MTTR, MES, SCADA, PLC, historian, predictive maintenance, condition monitoring, ppm defect rate, IATF 16949, ISO 9001, andon, kaizen, SMED, changeover, yield, scrap, throughput, Industry 4.0, IIoT, digital twin`,
  },

  fintech: {
    label: "Fintech",
    keywords: [
      "fintech", "neobank", "payment", "payments", "open banking", "psd2", "psd3",
      "api banking", "crypto", "defi", "insurtech", "regtech", "embedded finance",
      "checkout", "stripe", "plaid", "monzo", "revolut", "starling", "klarna",
      "bnpl", "lending", "credit", "underwriting", "fraud", "chargeback", "acquirer",
      "issuer", "scheme", "visa", "mastercard", "swift", "iso 20022",
    ],
    content: `DOMAIN: Financial Technology (Fintech)

ECONOMIC BUYERS — typical titles and what they are measured on:
- CTO: engineering velocity, system reliability (uptime/SLA), tech debt reduction, API performance
- CPO (Chief Product Officer): product delivery speed, feature adoption, customer NPS, conversion rate
- CEO (at startups/scale-ups <200 people): all of the above, plus runway and unit economics
- Head of Engineering / VP Engineering: team productivity, deployment frequency, incident rate
- Head of Compliance / MLRO: regulatory obligation fulfilment, FCA/PRA exam readiness, AML false positive rate

PAIN TRIGGERS — what creates urgency:
- Tech debt slowing velocity: as fintechs scale, early architectural decisions create compounding slowdowns — anything that measurably improves deployment frequency or reduces incident rate is compelling
- Compliance cost inflation: FCA authorisation and ongoing compliance (PSD2/PSD3, DORA, Consumer Duty) is expensive; regtech that reduces headcount required for compliance has direct margin impact
- Fraud losses: chargebacks, account takeover, synthetic identity fraud — each 1bp reduction in fraud losses on £1B+ transaction volume is worth £100k+ annually
- Onboarding conversion: KYC/AML friction causes 30–60% drop-off at account opening for digital banks; improving pass-through rate is a direct revenue impact
- Infrastructure cost: at scale, cloud and data processing costs become a major OpEx line — anything that reduces compute cost per transaction gets attention

BUDGET & PROCUREMENT:
- Early-stage fintech (<50 people): CEO decision, moves in days to weeks, month-to-month contracts acceptable
- Series B–D fintech (50–300 people): CTO/CPO decision with CEO sign-off; 4–12 week procurement; annual contracts standard
- Larger fintech (300+ people, or publicly regulated entity): procurement maturity growing; FCA TPSP requirements, DORA Article 28 due diligence, 3–6 month cycle
- Budget is product/engineering OpEx — not a separate "innovation" budget

CHAMPION PROFILE — real vs fan:
- Real champion: a senior engineer, tech lead, or Head of Product who has authority to trial and a direct line to the CTO/CPO
- They can make an internal case without you in the room, have run vendor evaluations before, and can move a pilot to contract without 6 months of committee review
- Fan: a junior developer or analyst who loves the product but needs the CTO to "see a demo" before anything can happen — and the CTO meeting hasn't been arranged after 3 calls
- Red flag: champion is engineering and the EB (CEO/CFO) hasn't been engaged — engineering-driven decisions that don't have commercial sign-off stall at contract stage

BUILD VS BUY:
- Fintechs default to build — engineering identity is strong, and "we could build that" is the default response
- Frame as: accelerating their product roadmap by months, not replacing their engineers; the right question is "what won't you build if you spend 6 months building this?"
- Time-to-market framing is more powerful than cost framing for fintechs
- Regulatory risk of in-house builds: FCA expects documented validation for regulated functions; your product's FCA-readiness documentation is a differentiator

REAL COMPETITION:
- Cloud-native services: AWS (Fraud Detector, Rekognition for KYC), GCP (Document AI, Cloud DLP)
- Open-source: Onfido alternatives, custom ML models on Hugging Face, internal data science teams
- Category specialists: Sardine/Feedzai (fraud), Onfido/Sumsub (KYC), ComplyAdvantage (AML)
- Incumbent banking platforms: Temenos, Thought Machine (for core banking challengers)

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: MSA, DPA, PCI DSS attestation where card data is in scope, SOC 2 Type II, a regulated-entity outsourcing schedule if the customer is authorised, partner or API agreements, and increasingly an AI-use addendum
- Fought over: the liability cap and what it is a multiple of, allocation of fraud losses, uptime commitments with real service credits, data residency, sub-processor control, and who absorbs the cost of regulatory change
- Cheap to concede: service credits capped at fees paid, evidence and attestation obligations, notice periods on sub-processor changes
- Expensive, however it is dressed: fraud loss allocation, and liability caps expressed as a multiple of fees when the transaction values flowing through you dwarf those fees
- The trap: a cap of twelve months fees sounds conventional and is meaningless if you process a hundred times that in value. Argue the cap against exposure, not against revenue.

KEY TERMINOLOGY: API-first, SLA/uptime, deployment frequency, KYC/AML, false positive rate, chargeback rate, NPS, conversion rate, Consumer Duty, DORA, PSD2/PSD3, FCA authorisation, e-money institution, payment institution, scheme rules, ISO 20022, open banking`,
  },

  government: {
    label: "Government & Public Sector",
    keywords: [
      "government", "public sector", "ministry", "cabinet office", "hmrc", "mod",
      "home office", "council", "local authority", "g-cloud", "crown commercial",
      "gds", "public procurement", "central government", "whitehall", "nhse",
      "ofsted", "ofgem", "regulator", "arms length body", "quango", "department",
      "civil service", "nao", "public accounts committee", "spending review",
      "digital service", "gdss", "mvp", "agile government",
    ],
    content: `DOMAIN: Government & Public Sector

ECONOMIC BUYERS — typical titles and what they are measured on:
- Senior Responsible Owner (SRO): programme delivery on time and budget, benefit realisation, Cabinet Office GMPP compliance
- Deputy Director / Director General: departmental efficiency (QALY savings in health, cost per case in justice, processing times in HMRC), headcount reduction targets
- CTO / CIO / CDIO (Chief Digital, Data and Technology Officer): digital maturity, legacy system reduction, cloud adoption targets
- Head of Digital: GDS service standard compliance, user satisfaction scores, digital delivery velocity
- CFO / Finance Director: Spending Review commitments, NAO audit readiness, cost avoidance targets

PAIN TRIGGERS — what creates urgency:
- Legacy system failure risk: HMRC runs COBOL mainframes, MoD has 40+-year-old systems — when legacy systems face end-of-support or create operational risk, there is genuine urgency to replace
- Spending Review commitment: if a Department has committed to a technology-enabled efficiency saving in the Spending Review, there is a hard deadline to deliver it — your product must tie to a named commitment
- NAO / PAC scrutiny: National Audit Office and Public Accounts Committee investigations create reputational pressure — departments invest to avoid a critical report
- Post-programme failure remediation: after a high-profile IT failure (NHS Test and Trace, Post Office Horizon, etc.), there is both budget and political will to demonstrate "doing it differently"
- GDS service standard: Government departments must pass GDS assessments for new digital services; tools that help meet service standards accelerate live service launch

BUDGET & PROCUREMENT:
- Annual Spending Review cycle: budgets are set for 1–3 year periods; outside cycle, only pre-approved programmes have budget
- Digital spending controls: CDDO (Central Digital and Data Office) approval required for technology spend over £1M; prepare a business case in HMT Green Book format
- MPRG gateway reviews: Major Projects Review Group reviews at key programme gates; attach your solution to a programme that has already passed Gateway 0/1
- Procurement routes: G-Cloud 14 (for cloud and software services — fastest route, no competition if direct award under threshold), Crown Commercial Service frameworks (DOS, RM6187), Open Competition required above OJEU threshold (£139k for goods/services)
- Due diligence: Cyber Essentials Plus mandatory, Government Security Classifications (OFFICIAL, SECRET), NCSC guidance compliance, data residency requirements (UK sovereign cloud for OFFICIAL-SENSITIVE and above)
- Timeline: G-Cloud direct award 4–8 weeks; competitive procurement 6–18 months; large programmes 12–36 months

CHAMPION PROFILE — real vs fan:
- Real champion: a Delivery Manager, Product Manager, or Head of Service who is named on the programme and has an SRO who is actively engaged
- They understand GDS service standards, have delivered at least one ALPHA or BETA stage service, and know how to write a business case in HMT format
- Fan: a policy analyst, junior digital advisor, or enthusiastic civil servant who sees the value but doesn't know the procurement process and hasn't identified the SRO
- Red flag: the SRO has not been identified, or the buying vehicle (G-Cloud vs competitive tender vs framework call-off) hasn't been established

BUILD VS BUY:
- GDS "buy not build" policy is official guidance — use it; central government is supposed to default to buy before commissioning bespoke development
- However, large SIs (Capgemini, Accenture, IBM, CGI, Sopra Steria) actively compete to wrap commodity products inside large transformation contracts — you may find yourself on a subcontract basis
- Positioning: direct G-Cloud route gives you direct relationships with the department; SI wrapping removes margin and control
- Key differentiator: UK data residency, government security accreditation, named government reference customers

REAL COMPETITION:
- Large SIs wrapping your product inside a bigger contract: Capgemini, Accenture, IBM, CGI, Sopra Steria, Deloitte
- Microsoft (deeply embedded via M365, Azure); AWS GovCloud
- Established GovTech vendors: Civica, NEC, Socitm, Arcus (local government)
- In-house digital teams (HMRC, DWP, GDS-influenced departments have strong internal teams)
- Do-nothing: civil service inertia is a real competitive force; "we've always done it this way" combined with risk aversion

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: framework terms (G-Cloud, Crown Commercial, Digital Outcomes), a call-off contract, the Model Services Contract on larger engagements, security clauses referencing Cyber Essentials Plus and Government Security Classifications, transparency and FOI obligations, and social value commitments
- Fought over: very little. Framework terms are largely fixed, which is the single most important fact in this section
- Cheap to concede: transparency and FOI obligations, publication of contract value, social value commitments you can genuinely meet
- Expensive, however it is dressed: IP ownership, where the default position often favours the Crown, and benchmarking or most-favoured-customer clauses that follow you into every other deal
- The trap: this is the one vertical where concession trading does not work. The terms are set before you arrive, and attempting to ladder them marks you as someone who has not bought through a framework before. Spend your effort on scope, on exit, and on IP — the only places with genuine movement.

KEY TERMINOLOGY: SRO, GMPP, Gateway review, GDS, service standard, G-Cloud, Crown Commercial, NAO, PAC, Spending Review, CDDO, digital spending controls, HMT Green Book, OJEU threshold, Cyber Essentials, Government Security Classifications, OFFICIAL-SENSITIVE, UK sovereign cloud, agile delivery, alpha/beta/live`,
  },

  software_technology: {
    label: "Software & Technology",
    keywords: [
      "saas", "platform team", "developer", "developers", "sdk", "api-first",
      "kubernetes", "observability", "devops", "microservices", "data platform",
      "mlops", "inference", "foundation model", "large language model", "llm",
      "machine learning", "embeddings", "fine-tuning", "vector database",
      "software company", "engineering team", "technology company", "scale-up",
      "frontier model", "language model", "model access", "tokens per second",
      "soc 2", "iso 27001", "penetration test", "uptime", "latency",
      "open source", "self-hosted", "multi-tenant", "developer experience",
    ],
    content: `DOMAIN: Software & Technology (selling to technology companies)

ECONOMIC BUYERS — typical titles and what they are measured on:
- CTO / VP Engineering: engineering velocity, cost per engineer, build-vs-buy discipline, platform reliability
- Head of Platform / Platform Engineering Lead: developer experience, internal adoption of shared services, toil reduction
- VP Data / Head of ML: model quality, inference cost per request, time from experiment to production
- CISO / Head of Security: SOC 2 and ISO 27001 posture, third-party risk, customer security questionnaires
- CFO (at scale-ups): gross margin, cloud and inference spend as a share of revenue, runway
- At smaller companies the CTO is often all of these at once; do not invent a committee that does not exist

PAIN TRIGGERS — what creates urgency:
- Cloud or inference spend growing faster than revenue: a direct margin problem, visible to the board, and the fastest route to CFO attention
- Engineering time spent on undifferentiated work: every hour on internal plumbing is an hour not on the product, and engineering leaders can quantify it in headcount
- A failed enterprise security review: losing a deal for a missing SOC 2 or a failed pen test creates immediate budget for whatever unblocks it
- An outage or latency regression that reached customers: postmortems create funded action items with named owners
- A key engineer leaving: bus-factor risk on a home-built system is the moment "we built it ourselves" stops being a point of pride
- A scaling wall ahead of a funding round or a large customer launch, where the deadline is external and immovable

BUDGET & PROCUREMENT:
- Usually OpEx from an engineering or platform budget, annual with monthly or consumption billing; land-and-expand is normal and expected
- Far faster than regulated industries: weeks rather than quarters, often a card or a simple order form below a threshold (commonly $10k–$50k)
- The security review IS the procurement process — SOC 2 Type II, a completed questionnaire, pen test summary, DPA, sub-processor list, and increasingly an AI-use addendum. Have these ready before you are asked; not having them is the most common stall in this vertical
- Consumption pricing invites a usage-based pilot, which is a good way in — but agree the success threshold and the expansion trigger in writing, or the pilot becomes a permanent discount
- Procurement teams appear above a revenue threshold; below it the CTO signs

CHAMPION PROFILE — real vs fan:
- Real champion: a staff or principal engineer, or a platform lead, who owns the problem, has tried to solve it internally, and can say what that cost. They run the evaluation themselves and argue your case when you are not in the room
- Fan: an engineer who loves the technology, stars the repo, and has neither budget nor mandate. Enormously common here, and the most frequent cause of a deal that feels warm for months and never closes
- The tell is whether they have ever killed an internal project. A champion who has retired their own code will buy; one who has not usually cannot
- Red flag: your champion cannot describe how software actually gets bought at their company

BUILD VS BUY — the defining dynamic in this vertical:
- Every prospect can build it. They have the engineers, the conviction, and often a prototype already. Assume the real competitor is a half-finished internal version with a sponsor
- Do not argue they cannot build it — argue what it costs to keep running. The honest frame is three-year total cost of ownership: the build, the maintenance tax, on-call burden, the opportunity cost of the two best engineers, and the migration when the author leaves
- Engineering teams underestimate build cost by 3–5x with striking consistency. Ask what their last internal platform project was estimated at and what it actually took; let their own history make the argument
- Your defensible ground is rarely the core algorithm. It is the integrations, the edge cases learned from other customers, the compliance evidence, and the fact that your roadmap is someone else's full-time job

REAL COMPETITION:
- The internal build, usually with an executive sponsor who proposed it
- The incumbent cloud provider's adequate and already-paid-for equivalent — bundling is a commercial force, not a technical comparison
- A credible open-source project plus the team's willingness to self-host; compete on operational burden, not features
- Doing nothing, which in a cost-cutting year is the most likely outcome of all

CULTURAL NORMS:
- Technical credibility is the entry ticket and it is assessed in the first ten minutes. Send an engineer to the first technical call, not only a commercial lead
- Marketing language is actively counterproductive. Specifics, benchmarks with methodology, and stated limitations build more trust than claims
- Documentation and a self-serve trial are part of the sale: buyers evaluate before they talk to you, and a gated demo loses deals you never hear about
- Reference customers with a recognisable engineering reputation outweigh larger logos
- Do not oversell AI capability to an audience that builds it. They will test the boundary immediately, and a caught exaggeration ends the deal

CONTRACTUAL SURFACE — what you will actually be asked to sign:
- Documents: MSA with an order form, DPA with standard contractual clauses, a sub-processor list, SOC 2 Type II report, their security questionnaire, an AI-use addendum, and a BAA if any health data is involved
- Fought over: the liability cap and its multiple, IP in integrations built specifically for them, source code escrow, most-favoured-customer and benchmarking clauses, termination for convenience, data deletion and portability, and whether you may train models on their data
- Cheap to concede: escrow, data portability, a contractual commitment never to train on their data (costs nothing if you were not going to, and is worth a great deal to them right now), longer notice periods
- Expensive, however it is dressed: most-favoured-customer clauses, which price every future deal; termination for convenience at short notice, which removes any forecast you might build; and assignment rather than licence of foreground IP
- The trap: model training rights are the new battleground and the clause is often buried in the AI addendum rather than the MSA. Decide your position before a buyer drafts it for you.

KEY TERMINOLOGY: SOC 2 Type II, ISO 27001, DPA, sub-processor, pen test, SSO, SAML, SCIM, RBAC, audit log, SLA, SLO, p99 latency, throughput, tokens per second, inference cost, cost per request, self-hosted, VPC deployment, air-gapped, multi-tenant, single-tenant, land-and-expand, net revenue retention, design partner, POC, build-vs-buy, platform team, developer experience, toil, on-call, bus factor`,
  },

};

// Matching a keyword anywhere inside a word is how "mod" (Ministry of Defence)
// used to match "models", "erp" matched "enterprises" and "pra" (Prudential
// Regulation Authority) matched "practices" — so an AI company describing
// itself in perfectly ordinary English was handed a confidently wrong
// playbook, silently, on every coaching turn. Match on word boundaries only.
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(lower: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    // Allow a trailing plural so "large language models" matches the
    // keyword "large language model" — without this, ordinary phrasing misses.
    const re = new RegExp(`\\b${escapeRegex(kw)}s?\\b`, "i");
    if (!re.test(lower)) continue;
    // A long, distinctive term ("aerospace", "airworthiness") is evidence on
    // its own; a three-letter acronym is not. Requiring MIN_SCORE means one
    // stray acronym can no longer select a playbook by itself.
    score += kw.length >= 6 ? 2 : 1;
  }
  return score;
}

const MIN_SCORE = 2;

export function detectVertical(text: string): Vertical | null {
  const lower = text.toLowerCase();
  let bestVertical: Vertical | null = null;
  let bestScore = 0;

  for (const [vertical, playbook] of Object.entries(PLAYBOOKS) as [Vertical, Playbook][]) {
    const score = countMatches(lower, playbook.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestVertical = vertical;
    }
  }

  // Below the threshold we return null and the coach runs on its base prompt.
  // No playbook is a better outcome than the wrong one: generic coaching that
  // asks good questions beats specific coaching about the wrong industry.
  return bestScore >= MIN_SCORE ? bestVertical : null;
}

export function getPlaybook(vertical: Vertical): string {
  const p = PLAYBOOKS[vertical];
  return `=== DOMAIN PLAYBOOK: ${p.label} ===\n${p.content}\n=== END PLAYBOOK ===`;
}

export const VERTICAL_LABELS: Record<Vertical, string> = Object.fromEntries(
  (Object.entries(PLAYBOOKS) as [Vertical, Playbook][]).map(([v, p]) => [v, p.label]),
) as Record<Vertical, string>;

/** Where a playbook choice came from, so the UI can be honest about it. */
export type PlaybookSource = "override" | "segment" | "account" | "product" | "none";

export interface ResolvedPlaybook {
  vertical: Vertical | null
  source: PlaybookSource
  label: string
}

export interface PlaybookInputs {
  /** deals.coach_playbook — an explicit human choice, or "none" to suppress. */
  override?: string | null
  /** The market segment this deal is tagged to. */
  segmentText?: string | null
  /** The account's own industry and name. */
  accountText?: string | null
  /** The org's product description — the legacy signal, now last. */
  productContext?: string | null
}

/**
 * Resolve which playbook coaches this deal.
 *
 * The order matters and is the point of the whole change. Tuning used to read
 * the org's product description — what the founder sells — while every
 * playbook describes the *buyer's* world. That works only while a founder
 * sells into the industry they came from. A founder with an aerospace deal and
 * a pharma deal needs different coaching on each, which is what treating ICP
 * as a portfolio means in practice.
 *
 * So: an explicit choice wins; then the deal's segment; then the account's
 * industry; and only then the org's product text, kept as a fallback for deals
 * with nothing else to go on. Nothing confident enough means no playbook.
 */
export function resolvePlaybook(inputs: PlaybookInputs): ResolvedPlaybook {
  const named = (v: Vertical | null, source: PlaybookSource): ResolvedPlaybook => ({
    vertical: v,
    source: v ? source : "none",
    label: v ? VERTICAL_LABELS[v] : "No domain playbook",
  });

  const override = inputs.override?.trim();
  if (override === "none") {
    return { vertical: null, source: "override", label: "No domain playbook (your choice)" };
  }
  if (override && override in PLAYBOOKS) {
    return named(override as Vertical, "override");
  }

  for (const [text, source] of [
    [inputs.segmentText, "segment"],
    [inputs.accountText, "account"],
    [inputs.productContext, "product"],
  ] as Array<[string | null | undefined, PlaybookSource]>) {
    if (!text?.trim()) continue;
    const v = detectVertical(text);
    if (v) return named(v, source);
  }

  return named(null, "none");
}
