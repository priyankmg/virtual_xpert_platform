# virtual_xpert_platform

Atlas
A Multi-Agent Virtual Expert Platform
Product Specification  •  Cursor Build Guide  •  v1.0

Inspired by Intuit's Virtual Expert Platform. Demonstrates agentic AI in service of a financial accounting persona navigating multi-system complexity — analogous to Proteus for the enterprise HR domain.

Persona: Sarah Chen, Controller — Meridian Home Goods (mid-market, 85 employees, $12M revenue)
Core Use Case: Tax preparation, IRS compliance review, and quarterly financial close
Stack: Next.js 15, TypeScript, Tailwind CSS, Anthropic Claude (claude-sonnet-4-20250514), Neon Postgres
Deployment: Vercel

Document Contents
•	Section 1 — Product Vision and Problem Statement
•	Section 2 — User Persona and Use Case
•	Section 3 — Source Systems (Mock Data)
•	Section 4 — Five Plane Architecture
•	Section 5 — Agent Specifications (6 agents + DAS)
•	Section 6 — UI / Page Map
•	Section 7 — API Route Map
•	Section 8 — Directory Structure
•	Section 9 — Mock Data Schemas
•	Section 10 — Cursor Build Instructions


1. Product Vision and Problem Statement
Atlas is a prototype of what Intuit's Virtual Expert Platform could look like when AI agents are embedded at every layer of the expert-customer interaction — from data aggregation through policy reasoning to final advisory output.

The Problem
A mid-market financial controller preparing for quarterly close and tax season faces the same fragmentation problem that Intuit identified with their '10-tool' insight: critical financial data lives across disconnected systems, each requiring manual navigation, context-switching, and data reconciliation before any meaningful analysis can happen.

Specifically for Sarah Chen at Meridian Home Goods:
•	QuickBooks Online holds P&L, chart of accounts, and transaction data
•	ADP/Payroll holds compensation, benefits, and payroll tax data
•	Expensify holds employee expense reports and reimbursements
•	Stripe holds revenue, refunds, and payment processing fees
•	A legacy inventory system holds COGS and inventory valuation
•	Prior-year TurboTax Business returns are the only historical tax reference

Before Atlas, a QuickBooks Live or TurboTax Live expert helping Sarah would spend 40–60 minutes just gathering and reconciling this data before they could offer a single recommendation. Atlas collapses that to under 5 minutes by aggregating, reconciling, and summarizing the financial picture automatically.

The Vision
An expert should arrive at every client session already holding a complete, reconciled picture of the client's financial situation — so the session is about judgment and advice, not data retrieval.
Atlas demonstrates this vision through a Five Plane architecture: a Data Aggregation Service at the foundation, AI agents handling summarization, policy evaluation, RAG-based precedent retrieval, and tax estimation, all governed by a layer that ensures high-stakes recommendations always involve human expert confirmation.


2. User Persona and Use Case
Primary Persona — Sarah Chen, Controller
•	Company: Meridian Home Goods — mid-market e-commerce, 85 employees, $12M annual revenue
•	Role: Controller / Head of Finance. Manages bookkeeping, payroll, tax compliance, and financial reporting
•	Pain: Spends 3–4 hours before every expert session pulling data manually across 5–6 systems
•	Goal: Understand her Q4 tax liability, identify deductions she may have missed, confirm payroll tax compliance, and get a confident recommendation from her Intuit expert before filing

Primary Use Case — Q4 Tax Readiness Review
Sarah has a scheduled session with her QuickBooks Live / TurboTax Live expert. Before the session, she wants Atlas to:
1.	Aggregate her financial data from all source systems into a single snapshot
2.	Summarize her financial position in plain language
3.	Evaluate her tax situation against current IRS rules and her company's policies
4.	Retrieve relevant IRS audit precedents and rulings that apply to her situation
5.	Estimate her federal and state tax liability for Q4 and full year
6.	Flag high-risk items that require expert human review before any action
The Intuit expert arrives at the session with all of this pre-assembled. The session becomes advisory, not administrative.


3. Source Systems (All Mock Data)
All source systems are simulated with TypeScript mock data files. No real API integrations required for the prototype.

System 1 — QuickBooks Online (Accounting)
•	Chart of accounts with YTD balances
•	P&L statement (monthly, quarterly, annual)
•	Balance sheet snapshot
•	Transaction ledger (last 90 days, categorized)
•	Outstanding accounts receivable and payable
•	Depreciation schedule for fixed assets

System 2 — ADP Payroll
•	Payroll register (all employees, YTD wages and withholdings)
•	Employer payroll tax obligations (FICA, FUTA, SUTA)
•	Benefits deductions (health, 401k, FSA)
•	Contractor payments (1099 candidates)
•	Payroll tax filings YTD (941, 940)

System 3 — Expensify (Expense Management)
•	Approved expense reports (categorized by IRS deductibility)
•	Flagged expenses (personal vs. business ambiguous)
•	Meal and entertainment expenses (50% deductibility rule)
•	Home office and travel expenses

System 4 — Stripe (Revenue / Payments)
•	Gross revenue by month
•	Refunds and chargebacks
•	Processing fees (deductible)
•	1099-K threshold tracking

System 5 — Inventory System (Legacy)
•	Beginning and ending inventory values
•	COGS calculation
•	Inventory write-downs
•	Shrinkage and obsolescence reserves

System 6 — Prior Year Tax Returns
•	Federal Form 1120-S (S-Corp return) — prior 3 years
•	Effective tax rate history
•	Prior carryforward losses or credits
•	Depreciation continuity (Form 4562)


4. Five Plane Architecture
Atlas uses the same Five Plane Framework as Proteus, adapted for the financial accounting domain.

Plane 1 — Experience Plane
The conversational interface. The Intuit Assistant handles natural language queries from both the expert and the client. Built on Claude claude-sonnet-4-20250514 via the Anthropic SDK.
•	Natural language query interface on the Dashboard
•	Intent classification routes queries to the appropriate downstream agent
•	Fallback to keyword-based routing when API unavailable
•	Example queries: "What is Sarah's estimated Q4 tax liability?", "Flag any payroll compliance issues", "Summarize her financial position for the expert session"

Plane 2 — Business Plane
Domain-specific agents that reason over financial data. Three agents live here: the Summarizer Agent, the Policy Evaluation Agent, and the Tax Estimation Classifier.

Plane 3 — Stack Plane
The Data Aggregation Service (DAS) and the RAG Agent live here. DAS pulls from all six source systems. The RAG Agent retrieves relevant IRS precedents and rulings from a vector store of simulated IRS documents.

Plane 4 — Orchestration Plane
An MCP-style orchestrator coordinates agent calls. When the Intuit Assistant receives a complex query, the orchestrator fans out to the appropriate agents in the correct sequence, collects their outputs, and assembles the final response.
•	Sequential orchestration for dependent calls (DAS must complete before Summarizer or Policy Agent)
•	Parallel orchestration for independent calls (RAG Agent and Tax Classifier can run concurrently)
•	Agent outputs are typed and passed as structured JSON between agents

Plane 5 — Governance Plane
Cuts across all planes. Every agent action is pre-classified by risk level. High-risk actions (tax filing recommendations, IRS correspondence suggestions, deduction claims above threshold) require explicit expert confirmation before the platform surfaces them to the client.
•	Risk levels: READ (autonomous), ADVISORY (surfaced with confidence score), ACTION (requires expert confirmation)
•	All agent decisions logged to Neon Postgres with timestamps, inputs, outputs, and confidence scores
•	Audit trail viewable in the Governance dashboard


5. Agent Specifications
5.1 Data Aggregation Service (DAS)
Purpose: Assembles a point-in-time financial snapshot for a given client by pulling from all six source systems. The DAS is the foundation all other agents depend on. No agent calls DAS directly — the orchestrator calls DAS first and passes the snapshot downstream.

Inputs
•	clientId: string
•	snapshotDate: ISO date string (defaults to today)
•	systems: string[] (optional — defaults to all six systems)

Processing
•	Fetches mock data from each system module in parallel
•	Reconciles interSystem discrepancies (e.g. Stripe revenue vs. QuickBooks revenue recognition)
•	Flags data gaps or inconsistencies for expert review
•	Returns a typed ClientFinancialSnapshot object

Output Schema — ClientFinancialSnapshot
clientId: string
snapshotDate: string
accounting: { revenue, cogs, grossProfit, operatingExpenses, netIncome, assets, liabilities }
payroll: { totalWages, employerTaxes, benefitsDeductions, contractorPayments, filingStatus }
expenses: { total, deductible, flagged, byCategory }
revenue: { stripe: { gross, refunds, fees }, recognized, deferred }
inventory: { beginningValue, endingValue, cogs, writeDowns }
taxHistory: { priorYearReturns[], effectiveTaxRates[], carryforwards }
dataGaps: string[]
reconciliationFlags: { field, system1Value, system2Value, delta }[]

API Route
POST /api/das/snapshot
GET  /api/das/snapshot/:clientId  (returns cached snapshot)

5.2 Intuit Assistant
Purpose: Conversational AI interface. Accepts natural language queries, classifies intent, routes to appropriate agents via the orchestrator, and returns a synthesized plain-language response.

Intent Categories
•	SNAPSHOT_QUERY — questions about current financial data (routes to DAS)
•	SUMMARY_REQUEST — requests for plain-language summaries (routes to Summarizer Agent)
•	POLICY_CHECK — compliance or deductibility questions (routes to Policy Evaluation Agent)
•	PRECEDENT_LOOKUP — IRS audit history questions (routes to RAG Agent)
•	TAX_ESTIMATE — liability estimation requests (routes to Tax Classifier)
•	GENERAL — handled directly by Claude without downstream agent calls

System Prompt Principles
•	Always identify when a response requires expert confirmation before being shared with the client
•	Never state a tax position as definitive — always frame as 'based on the data available'
•	Surface confidence scores when available from downstream agents
•	Flag data gaps that could affect the accuracy of any response

API Route
POST /api/assistant/chat
Body: { messages: Message[], clientId: string }

5.3 Summarizer Agent
Purpose: Takes the ClientFinancialSnapshot from DAS and generates a structured plain-language summary in three layers: executive summary (3 sentences), financial highlights (key metrics), and items requiring attention (flags, risks, data gaps).

Inputs
•	snapshot: ClientFinancialSnapshot (from DAS)
•	audienceType: 'expert' | 'client' (adjusts language complexity)

Output Schema — FinancialSummary
executiveSummary: string  (3 sentences, plain language)
keyMetrics: { label, value, trend, benchmark }[]
attentionItems: { severity: 'HIGH'|'MEDIUM'|'LOW', description, source }[]
readyForExpertSession: boolean
estimatedSessionPrepTime: string  (e.g. '< 5 minutes with Atlas')

Behavior Notes
•	Expert audience: surfaces reconciliation flags and data gaps prominently
•	Client audience: plain language, no accounting jargon, focus on what it means for them
•	Always flags if a prior-year carryforward or credit may be applicable

API Route
POST /api/agents/summarizer

5.4 Policy Evaluation Agent
Purpose: Evaluates the client's financial data against two policy sets: IRS tax rules (deductibility standards, filing requirements, payroll tax obligations) and the company's own stated financial policies (expense approval thresholds, capitalization policy, travel policy). Returns a structured compliance report with confidence scores.

Policy Sources (Mock)
•	IRS Publication 535 — Business Expenses (deductibility rules)
•	IRS Publication 15 — Employer's Tax Guide (payroll tax obligations)
•	IRS Publication 946 — Depreciation (Section 179, bonus depreciation)
•	IRC Section 199A — Qualified Business Income deduction rules
•	Meridian Home Goods internal expense policy (mock JSON)
•	Meridian Home Goods capitalization policy (mock JSON)

Evaluation Areas
•	Expense deductibility: flags expenses that may be non-deductible or only partially deductible
•	Payroll tax compliance: confirms 941/940 obligations are met; flags misclassified contractors
•	Depreciation: validates Section 179 elections and bonus depreciation claims against asset register
•	QBI deduction eligibility: estimates S-Corp QBI deduction applicability
•	Estimated tax payments: checks if quarterly payments are on track

Output Schema — PolicyEvaluationReport
evaluationDate: string
overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
findings: { area, finding, policyReference, riskLevel, confidence, requiresExpertReview }[]
deductionOpportunities: { description, estimatedValue, confidence, policyReference }[]
complianceGaps: { description, deadline, severity }[]
expertReviewRequired: boolean

API Route
POST /api/agents/policy-evaluation

5.5 RAG Agent — IRS Precedent Retrieval
Purpose: Retrieves relevant IRS audit cases, Tax Court rulings, and IRS guidance documents that are factually similar to the client's situation. Grounds policy evaluation findings in real precedent. Reduces hallucination risk by constraining responses to retrieved source material.

Vector Store (Simulated)
For the prototype, the vector store is simulated as a TypeScript array of structured precedent objects. In production this would be a real vector DB (Pinecone, pgvector). The prototype uses semantic similarity via Claude embeddings or simple keyword matching.
•	50–80 mock IRS precedent records covering common SMB tax scenarios
•	Each record: { id, title, year, topic, keyFacts, ruling, relevanceKeywords, citationId }

Precedent Categories
•	Home office deduction disputes (IRC 280A)
•	Business meal and entertainment disallowances
•	Worker classification (employee vs. independent contractor)
•	S-Corp reasonable compensation rulings
•	Inventory valuation method changes (FIFO vs. weighted average)
•	Vehicle expense disputes (actual cost vs. standard mileage)
•	Section 179 recapture on disposed assets
•	Payroll tax deposit penalties (FTD penalty cases)

Retrieval Logic
•	Policy Evaluation Agent passes its findings as a query to the RAG Agent
•	RAG Agent returns top 3–5 most relevant precedents per finding
•	Each precedent includes: ruling summary, outcome for taxpayer, and applicability confidence

Output Schema
query: string
precedents: { id, title, year, relevanceScore, rulingSummary, taxpayerOutcome, applicabilityNote }[]
sourcesRetrieved: number
confidenceInRelevance: number  (0–1)

API Route
POST /api/agents/rag-precedent

5.6 Tax Estimation Classifier
Purpose: Estimates the client's federal and state income tax liability for the current year based on the financial snapshot, applicable deductions identified by the Policy Agent, and prior-year effective tax rates. Returns a range (conservative / base / optimistic) with the key assumptions behind each scenario.

Estimation Approach
•	Base scenario: uses current YTD financials extrapolated to year-end, standard deductions only
•	Conservative scenario: assumes flagged deductions are disallowed, no QBI deduction
•	Optimistic scenario: all identified deduction opportunities realized, QBI deduction applied
•	For each scenario: federal taxable income, federal tax at applicable rate, estimated state tax (uses California as default), self-employment tax if applicable, total estimated liability

Output Schema — TaxEstimate
taxYear: number
entityType: 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole Proprietor'
scenarios: {
  conservative: { federalTaxableIncome, federalTax, stateTax, totalLiability, keyAssumptions[] }
  base: { ... }
  optimistic: { ... }
}
quarterlyPaymentsRequired: { q1, q2, q3, q4 }
priorYearComparison: { priorLiability, change, changePercent }
expertReviewRecommended: boolean
confidenceScore: number  (0–1)
disclaimer: string  (always appended — not tax advice, requires CPA review)

API Route
POST /api/agents/tax-classifier

5.7 Governance Agent
Purpose: Classifies every agent action by risk level, enforces approval thresholds, logs all agent decisions, and provides the audit trail view in the Governance dashboard.

Risk Classification
•	READ — data retrieval only (DAS snapshot, RAG lookup): runs autonomously, logged
•	ADVISORY — analysis and recommendations (Summarizer, Policy Agent, Tax Classifier): surfaced to expert with confidence score, no client-facing output without expert review
•	ACTION — any recommendation the client would act on (file amendment, pay estimated taxes, claim deduction): requires explicit expert confirmation button before surfacing to client

Audit Log Schema
logId: string
timestamp: string
agentName: string
actionType: 'READ' | 'ADVISORY' | 'ACTION'
clientId: string
inputSummary: string
outputSummary: string
confidenceScore: number
expertReviewRequired: boolean
expertApproved: boolean | null
expertId: string | null

API Routes
POST /api/governance/classify
POST /api/governance/approve  (expert approves an ACTION item)
GET  /api/governance/log       (returns audit log for dashboard)


6. UI / Page Map
All pages use Tailwind CSS. Dark sidebar navigation. Same visual language as Proteus but in Intuit's color palette (Intuit blue #0077C5 as primary accent).

/ — Dashboard
•	Client selector dropdown (pre-populated with Sarah Chen + 2 other mock clients)
•	Financial health summary cards: Revenue YTD, Net Income, Estimated Tax Liability, Open Action Items
•	Intuit Assistant chat panel (right side or bottom) — persistent across session
•	Recent agent activity feed (last 5 governance log entries)
•	"Prepare for Expert Session" CTA — triggers full DAS + Summarizer + Policy + Tax pipeline

/financial-snapshot — Financial Snapshot
•	Tabbed view: Overview / Accounting / Payroll / Expenses / Revenue / Inventory
•	Each tab shows the relevant DAS data in a clean table/card layout
•	Reconciliation flags shown inline with yellow warning badges
•	Data gaps shown with red badges and "Missing data" labels
•	"Refresh Snapshot" button re-triggers DAS for all systems

/session-brief — Expert Session Brief
•	The output of the full pipeline in a single printable/shareable view
•	Executive summary (3 sentences from Summarizer Agent)
•	Key metrics table
•	Attention items list (sorted by severity)
•	Policy findings summary with confidence scores
•	Top 3 IRS precedents surfaced by RAG Agent
•	Tax estimate (3 scenarios) with prior year comparison
•	Expert Review Required panel — ACTION items pending approval

/policy-review — Policy Evaluation
•	Full policy evaluation report
•	Findings organized by area (Expenses, Payroll, Depreciation, QBI, Estimated Tax)
•	Each finding shows: description, policy reference, risk level badge, confidence score
•	Deduction opportunities section with estimated dollar values
•	Compliance gaps with deadlines

/precedents — IRS Precedent Library
•	Search interface for the mock precedent vector store
•	Results show: case title, year, ruling summary, taxpayer outcome, relevance score
•	"Find Similar Cases" button on any policy finding — triggers RAG Agent with that finding as query
•	Case detail modal with full mock ruling text

/tax-estimate — Tax Estimation
•	Three-scenario tax estimate view (conservative / base / optimistic)
•	Interactive assumption toggles (check/uncheck deductions to see impact on estimate)
•	Quarterly payment schedule
•	Prior year comparison chart (bar chart using recharts)
•	Disclaimer banner: "This estimate is for planning purposes only and does not constitute tax advice."

/governance — Governance Log
•	Full audit log table: timestamp, agent, action type, risk level, confidence, expert approval status
•	Filter by agent, risk level, date range
•	Pending approvals panel at top — ACTION items awaiting expert confirmation
•	"Approve" and "Reject" buttons on pending items

/agents — Agent Status
•	Status card for each agent: last run, latency, confidence score, status badge
•	"Run Agent" button for manual trigger of each agent
•	Agent dependency diagram (DAS → Summarizer, Policy Agent, Tax Classifier; Policy Agent → RAG Agent)


7. API Route Map
All routes are Next.js App Router API routes (src/app/api/...). All return JSON.

DAS Routes
POST /api/das/snapshot          — generate full snapshot for clientId
GET  /api/das/snapshot/[id]     — retrieve cached snapshot
GET  /api/das/systems           — list available source systems and status

Assistant Routes
POST /api/assistant/chat        — send message, get response + agent routing

Agent Routes
POST /api/agents/summarizer     — generate FinancialSummary from snapshot
POST /api/agents/policy         — run PolicyEvaluationReport
POST /api/agents/rag            — retrieve IRS precedents for a query
POST /api/agents/tax-classifier — generate TaxEstimate
POST /api/agents/orchestrate    — run full pipeline (DAS → all agents)

Governance Routes
POST /api/governance/classify   — classify an action by risk level
POST /api/governance/approve    — expert approves an ACTION item
GET  /api/governance/log        — retrieve audit log
GET  /api/governance/pending    — retrieve pending expert approvals


8. Directory Structure

atlas/
  src/
    app/
      api/
        das/
          snapshot/
            route.ts
          systems/
            route.ts
        assistant/
          chat/
            route.ts
        agents/
          summarizer/route.ts
          policy/route.ts
          rag/route.ts
          tax-classifier/route.ts
          orchestrate/route.ts
        governance/
          classify/route.ts
          approve/route.ts
          log/route.ts
          pending/route.ts
      (pages)/
        page.tsx                  ← Dashboard
        financial-snapshot/page.tsx
        session-brief/page.tsx
        policy-review/page.tsx
        precedents/page.tsx
        tax-estimate/page.tsx
        governance/page.tsx
        agents/page.tsx
      layout.tsx
      globals.css
    agents/
      das.ts                      ← Data Aggregation Service
      intuit-assistant.ts
      summarizer-agent.ts
      policy-evaluation-agent.ts
      rag-agent.ts
      tax-classifier-agent.ts
      governance-agent.ts
    services/
      orchestrator.ts             ← Coordinates multi-agent pipelines
      governance-store.ts         ← Audit log persistence
    data/
      mock/
        quickbooks.ts             ← Mock QBO data
        adp-payroll.ts
        expensify.ts
        stripe.ts
        inventory.ts
        prior-tax-returns.ts
        irs-precedents.ts         ← Mock RAG vector store
        irs-policy-docs.ts        ← Mock IRS publications
      types/
        snapshot.ts               ← ClientFinancialSnapshot type
        agents.ts                 ← All agent input/output types
        governance.ts
    components/
      ui/                         ← Shared components
      layout/
        Sidebar.tsx
        Header.tsx
      agents/                     ← Agent-specific display components
      dashboard/
  .env.local
  package.json
  tailwind.config.ts
  tsconfig.json


9. Key Mock Data Schemas
Cursor should generate realistic mock data for Sarah Chen / Meridian Home Goods. The following values establish the scenario.

Meridian Home Goods — Financial Profile
•	Entity type: S-Corporation
•	State: California
•	Tax year: 2025
•	Annual revenue (Stripe): $12.4M
•	QuickBooks net income YTD: $1.87M
•	Total payroll (ADP): $3.2M across 85 employees
•	Total approved expenses (Expensify): $284K
•	Flagged expenses: $42K (personal/business ambiguous)
•	Inventory value (end of Q3): $1.1M
•	Prior year effective tax rate: 21.3%
•	Prior year carryforward loss: $0 (profitable 3 years running)

IRS Precedent Records — Build at Least These 8
•	Case 1: Contractor misclassification — taxpayer lost, $180K assessment. Keywords: 1099, contractor, employee
•	Case 2: S-Corp reasonable compensation — IRS challenged below-market salary. Keywords: reasonable compensation, S-Corp, distributions
•	Case 3: Home office deduction — taxpayer won with exclusive use documentation. Keywords: home office, 280A
•	Case 4: Meal expense disallowance — 50% limit, no business purpose documented. Keywords: meals, entertainment, 274
•	Case 5: Section 179 recapture — asset sold before end of recovery period. Keywords: Section 179, recapture, disposal
•	Case 6: FTD penalty abatement — first-time abatement granted. Keywords: payroll tax deposit, FTD penalty, 941
•	Case 7: QBI deduction — specified service trade or business exclusion. Keywords: 199A, QBI, specified service
•	Case 8: Inventory write-down — lower of cost or market method accepted. Keywords: inventory, write-down, COGS


10. Cursor Build Instructions
Paste this section into Cursor as your initial prompt after setting up the project scaffold.

Step 1 — Project Setup
7.	Run: npx create-next-app@latest atlas --typescript --tailwind --app --src-dir
8.	Install dependencies: npm install @anthropic-ai/sdk @neondatabase/serverless recharts lucide-react
9.	Create .env.local with ANTHROPIC_API_KEY and DATABASE_URL (Neon Postgres)
10.	Create the full directory structure from Section 8

Step 2 — Build Order (give Cursor one step at a time)
11.	Mock data files first (src/data/mock/). Generate realistic data for Meridian Home Goods per Section 9.
12.	TypeScript type definitions (src/data/types/). Define all schemas from Section 5 exactly.
13.	DAS agent (src/agents/das.ts) and its API route. Test snapshot generation before proceeding.
14.	Governance agent and store (needed before other agents so logging is in place).
15.	Summarizer, Policy Evaluation, RAG, and Tax Classifier agents — in that order.
16.	Orchestrator service (coordinates the full pipeline).
17.	Intuit Assistant (depends on orchestrator for complex intents).
18.	Layout: Sidebar, Header, globals.css with Intuit color palette.
19.	Dashboard page — wire up DAS snapshot cards and Intuit Assistant chat.
20.	Remaining pages in order: Financial Snapshot, Session Brief, Policy Review, Precedents, Tax Estimate, Governance, Agents.

Step 3 — Cursor Prompt Template
Use this prompt pattern for each agent:

Build the [AGENT NAME] for the Atlas platform. It is located at src/agents/[filename].ts. The input type is [INPUT TYPE from Section 5]. The output type is [OUTPUT TYPE from Section 5]. It should call the Anthropic API using claude-sonnet-4-20250514 with a system prompt that [BEHAVIOR NOTES from Section 5]. It should log its action to the governance store before returning. Also create the API route at src/app/api/agents/[route]/route.ts that accepts a POST request, calls the agent, and returns the typed output as JSON. Include error handling and return a 500 with an error message if the Claude call fails.

Design Guidelines for Cursor
•	Color palette: primary #0077C5 (Intuit blue), accent #FF6900 (Intuit orange), dark background #0F1923, card background #1A2535
•	Font: Inter (Google Fonts). Clean, professional, financial-grade aesthetic.
•	Every agent output panel should show: agent name badge, confidence score, timestamp, and a 'Requires Expert Review' badge if applicable
•	The Intuit Assistant chat panel should persist across all pages — implement as a floating panel or sidebar drawer
•	The Governance log should auto-refresh every 10 seconds when on the /governance page
•	Tax estimates must always show the disclaimer banner — never suppress it
•	All monetary values formatted as USD with commas. All percentages to 1 decimal place.

What to Demo to Deepali
When you show this prototype in an interview or include it in your portfolio, walk through this sequence:
21.	Dashboard — show the fragmentation problem: 6 systems, incomplete picture without Atlas
22.	Click 'Prepare for Expert Session' — watch the full pipeline run (DAS → all agents)
23.	Session Brief — show what the expert sees before the session: complete, confidence-scored, ready
24.	Policy Review — show contractor misclassification flag with RAG precedent attached
25.	Tax Estimate — show three scenarios and toggle a deduction off to see real-time impact
26.	Governance — show the audit log and an ACTION item pending expert approval
27.	Intuit Assistant — ask 'What is Sarah's biggest tax risk this year?' and walk through the agent routing

The demo arc: data fragmentation → aggregation → AI-powered analysis → human expert confirmation → governed audit trail. That is the VEP story.
