# Atlas — Multi-Agent Virtual Expert Platform

**Product Specification · Cursor Build Guide · v2.0**

> Inspired by Intuit's Virtual Expert Platform. Demonstrates agentic AI in service of a credentialed Intuit Expert navigating multi-client, multi-system complexity — analogous to Proteus for the enterprise HR domain.

| | |
|---|---|
| **Primary Persona** | Marcus Rivera — QuickBooks Live ProAdvisor, CPA |
| **Core Use Case** | Expert pre-session prep, live in-session AI assistance, and post-session quality review |
| **Featured Client** | Sarah Chen, Controller — Meridian Home Goods (S-Corp, 85 employees, $12M revenue) |
| **Stack** | Next.js 15, TypeScript, Tailwind CSS, Anthropic Claude (claude-opus-4-5), Neon Postgres |
| **Deployment** | Vercel |

---

## Table of Contents

1. [Product Vision and Problem Statement](#1-product-vision-and-problem-statement)
2. [User Personas](#2-user-personas)
3. [Three-Phase Expert Workflow](#3-three-phase-expert-workflow)
4. [Source Systems (Mock Data)](#4-source-systems-mock-data)
5. [Five Plane Architecture](#5-five-plane-architecture)
6. [Agent Specifications](#6-agent-specifications)
7. [UI / Page Map](#7-ui--page-map)
8. [API Route Map](#8-api-route-map)
9. [Directory Structure](#9-directory-structure)
10. [Mock Data Schemas](#10-mock-data-schemas)
11. [Getting Started](#11-getting-started)

---

## 1. Product Vision and Problem Statement

Atlas is a prototype of what Intuit's Virtual Expert Platform could look like when AI agents are embedded at every layer of the expert-customer interaction — from data aggregation through policy reasoning to final advisory output.

### The Problem

An Intuit Expert handling 8 client sessions per day faces a fragmentation problem that mirrors the "10-tool" challenge Intuit identified for small businesses. Before every session, the expert must manually gather client financial data from 5–6 disconnected systems — navigating QuickBooks, payroll platforms, expense tools, revenue systems, and prior tax returns — before they can offer a single recommendation.

For **Marcus Rivera** preparing for a session with Meridian Home Goods client Sarah Chen:

- **QuickBooks Online** holds P&L, chart of accounts, and transaction data
- **ADP Payroll** holds compensation, benefits, and payroll tax data
- **Expensify** holds employee expense reports and reimbursements
- **Stripe** holds revenue, refunds, and payment processing fees
- **A legacy inventory system** holds COGS and inventory valuation
- **Prior-year TurboTax Business returns** are the only historical tax reference

Before Atlas, a QuickBooks Live expert helping Sarah would spend **40–60 minutes** just gathering and reconciling this data before they could offer a single recommendation. Atlas collapses that to **under 5 minutes** by aggregating, reconciling, and summarizing the financial picture automatically.

### The Vision

> An expert should arrive at every client session already holding a complete, reconciled picture of the client's financial situation — so the session is about judgment and advice, not data retrieval.

Atlas demonstrates this vision through a Five Plane architecture: a Data Aggregation Service at the foundation, AI agents handling summarization, policy evaluation, RAG-based precedent retrieval, and tax estimation — all governed by a layer that ensures high-stakes recommendations always involve human expert confirmation.

---

## 2. User Personas

### Primary Persona — Marcus Rivera, Intuit Expert

Marcus is the **platform user**. He is the credentialed professional Intuit employs to deliver QuickBooks Live and TurboTax Live services.

| Attribute | Detail |
|---|---|
| Role | QuickBooks Live ProAdvisor |
| Credentials | CPA, QuickBooks ProAdvisor Certified, TurboTax Live Business Certified |
| Experience | 9 years in public accounting, 4 years at Intuit |
| Specialty | SMB accounting, S-Corp tax, payroll compliance |
| Daily load | 8 client sessions/day, 40–60 min each |
| Client mix | Mid-market SMBs, 20–150 employees, e-commerce and services |
| Pain point | 40–60 min of manual pre-session data gathering per client — consuming up to 8 hrs before he can do actual expert work |
| Goal | Arrive at every session fully briefed, deliver confident recommendations faster, trust that AI-surfaced findings are accurate enough to act on |

**Atlas adoption:** 94% of Marcus's sessions use the pre-session brief.  
**CSAT (trailing 30 days):** 4.87 / 5.0

### Secondary Persona — Sarah Chen, Controller (Client — does not use Atlas)

Sarah is the end customer whose financial data powers Atlas. She experiences better sessions because Marcus is better prepared — but she **never interacts with the platform directly**.

| Attribute | Detail |
|---|---|
| Company | Meridian Home Goods — S-Corp, 85 employees, $12M revenue, California |
| Role | Controller / Head of Finance |
| Data sources | QuickBooks Online, ADP Payroll, Expensify, Stripe, legacy inventory system, prior TurboTax Business returns |
| Goal | Understand Q4 tax liability, confirm payroll compliance, identify missed deductions, get actionable recommendations before filing |

Sarah benefits from Atlas indirectly — sessions that used to consume 40 minutes of data gathering now reach substantive advice in under 10 minutes.

---

## 3. Three-Phase Expert Workflow

### Phase 1 — Pre-Session (Marcus, 30 minutes before)

1. Opens Atlas work queue → selects Sarah Chen's upcoming session card
2. Clicks **"Generate Session Brief"** → triggers DAS + full agent pipeline automatically
3. Reviews AI-generated session brief: financial summary, policy flags, IRS precedents, tax estimate
4. Reviews and **approves governance ACTION items** before session starts — any recommendation requiring expert confirmation is held here
5. Enters the session confident and briefed — not scrambling for data

### Phase 2 — Live Session (Marcus + Sarah, 60 minutes)

1. Uses **Intuit Assistant panel** to answer ad-hoc client questions in real time (e.g. "Is her home office deductible given her lease structure?")
2. RAG Agent surfaces relevant IRS precedents inline when complex policy questions are triggered
3. Tax Classifier updates the estimate in real time as Marcus and Sarah toggle deduction scenarios
4. Governance panel flags any recommendation that reaches **ACTION risk level** — Marcus confirms before stating it to Sarah

### Phase 3 — Post-Session (Marcus, 10 minutes after)

1. Reviews session summary and quality score generated by Governance Agent
2. Confirms or overrides AI recommendations made during the session — logged to audit trail
3. Next client's session brief is already being generated in the background

---

## 4. Source Systems (Mock Data)

All source systems are simulated with TypeScript mock data files. No real API integrations required for the prototype.

| System | Data |
|---|---|
| **QuickBooks Online** | Chart of accounts (YTD), P&L (monthly/quarterly/annual), balance sheet, transaction ledger (last 90 days), AR/AP, depreciation schedule |
| **ADP Payroll** | Payroll register (YTD wages + withholdings), employer tax obligations (FICA/FUTA/SUTA), benefits deductions, contractor payments, 941/940 filings |
| **Expensify** | Approved expense reports (by IRS deductibility), flagged expenses, meals/entertainment, home office and travel |
| **Stripe** | Gross revenue by month, refunds and chargebacks, processing fees (deductible), 1099-K threshold tracking |
| **Inventory System** | Beginning/ending inventory values, COGS, write-downs, shrinkage and obsolescence reserves |
| **Prior Year Tax Returns** | Federal Form 1120-S (S-Corp) — prior 3 years, effective tax rate history, carryforward losses/credits, depreciation continuity (Form 4562) |

---

## 5. Five Plane Architecture

### Plane 1 — Experience Plane
The conversational interface. The Intuit Assistant handles natural language queries from both the expert and the client, built on Claude claude-opus-4-5 via the Anthropic SDK.

- Natural language query interface on the Dashboard and in-session view
- Intent classification routes queries to the appropriate downstream agent
- Fallback to keyword-based routing when API unavailable
- Example queries: *"What is Sarah's estimated Q4 tax liability?"*, *"Flag any payroll compliance issues"*, *"Summarize her financial position"*

### Plane 2 — Business Plane
Domain-specific agents that reason over financial data: **Summarizer Agent**, **Policy Evaluation Agent**, and **Tax Estimation Classifier**.

### Plane 3 — Stack Plane
The **Data Aggregation Service (DAS)** and **RAG Agent** live here. DAS pulls from all six source systems. The RAG Agent retrieves relevant IRS precedents from a simulated vector store.

### Plane 4 — Orchestration Plane
An MCP-style orchestrator coordinates agent calls — sequential for dependent calls (DAS before analysis agents), parallel for independent calls (RAG + Tax Classifier can run concurrently). Agent outputs are typed and passed as structured JSON.

### Plane 5 — Governance Plane
Cuts across all planes. Every agent action is pre-classified by risk level:

| Risk Level | Behavior |
|---|---|
| **READ** | Data retrieval only (DAS, RAG). Runs autonomously and is logged. |
| **ADVISORY** | Analysis and recommendations (Summarizer, Policy, Tax). Surfaced to expert with confidence score. No client delivery without expert review. |
| **ACTION** | Any recommendation the client would act on (file amendment, pay estimated taxes, claim deduction). Requires explicit expert confirmation before surfacing to client. |

All agent decisions logged to Neon Postgres with timestamps, inputs, outputs, and confidence scores.

---

## 6. Agent Specifications

### 6.1 Data Aggregation Service (DAS)
**Purpose:** Assembles a point-in-time `ClientFinancialSnapshot` by pulling from all six source systems in parallel. All other agents receive the snapshot from the orchestrator — they never call DAS directly.

**API:**
```
POST /api/das/snapshot        — generate snapshot for clientId
GET  /api/das/snapshot?clientId — retrieve cached snapshot
GET  /api/das/systems         — list source system connection status
```

### 6.2 Intuit Assistant
**Purpose:** Conversational AI interface. Classifies intent, routes to agents via the orchestrator, returns plain-language responses.

**Intent categories:** `SNAPSHOT_QUERY` · `SUMMARY_REQUEST` · `POLICY_CHECK` · `PRECEDENT_LOOKUP` · `TAX_ESTIMATE` · `GENERAL`

**System prompt principles:**
- Always identify when a response requires expert confirmation
- Never state a tax position as definitive — frame as "based on the data available"
- Surface confidence scores when available
- Flag data gaps that could affect accuracy

**API:** `POST /api/assistant/chat`

### 6.3 Summarizer Agent
**Purpose:** Generates a structured plain-language summary in three layers: executive summary (3 sentences), financial highlights (key metrics), and items requiring attention (flags, risks, data gaps).

**Output:** `FinancialSummary` — `executiveSummary`, `keyMetrics[]`, `attentionItems[]`, `readyForExpertSession`, `estimatedSessionPrepTime`

**API:** `POST /api/agents/summarizer`

### 6.4 Policy Evaluation Agent
**Purpose:** Evaluates financial data against IRS Publications 535, 15, 946, IRC 199A, and Meridian's internal policies. Returns a structured compliance report with confidence scores.

**Evaluation areas:** Expense deductibility · Payroll tax compliance · Depreciation (§179/bonus) · QBI deduction eligibility · Estimated tax payments

**Output:** `PolicyEvaluationReport` — `overallRiskLevel`, `findings[]`, `deductionOpportunities[]`, `complianceGaps[]`, `expertReviewRequired`

**API:** `POST /api/agents/policy`

### 6.5 RAG Agent — IRS Precedent Retrieval
**Purpose:** Retrieves relevant IRS audit cases, Tax Court rulings, and IRS guidance that are factually similar to the client's situation. Reduces hallucination risk by constraining responses to retrieved source material.

**Vector store:** Simulated as a TypeScript array of 8+ structured precedent objects. Uses keyword-based similarity for the prototype.

**Output:** `RAGResult` — `query`, `precedents[]`, `sourcesRetrieved`, `confidenceInRelevance`

**API:** `POST /api/agents/rag`

### 6.6 Tax Estimation Classifier
**Purpose:** Estimates federal and California state tax liability across three scenarios with key assumptions.

| Scenario | Assumptions |
|---|---|
| **Conservative** | All flagged deductions disallowed, no QBI, contractor reclassification risk included |
| **Base** | Entertainment disallowed, 50% meal limit, QBI applied, contractors as-is |
| **Optimistic** | All deductions realized, QBI in full, Section 179 maximized |

**Output:** `TaxEstimate` — `scenarios{conservative, base, optimistic}`, `quarterlyPaymentsRequired`, `priorYearComparison`, `confidenceScore`, `disclaimer`

**API:** `POST /api/agents/tax-classifier`

### 6.7 Governance Agent
**Purpose:** Classifies every agent action by risk level, enforces approval thresholds, logs all decisions, and provides the audit trail.

**API:**
```
POST /api/governance/classify   — classify action by risk level
POST /api/governance/approve    — expert approves/rejects an ACTION item
GET  /api/governance/log        — retrieve audit log
GET  /api/governance/pending    — retrieve pending approvals
```

---

## 7. UI / Page Map

All pages use Tailwind CSS. White/light background. Intuit color palette (`#0077C5` primary, `#FF6900` accent).

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Expert work queue — Marcus's session list for today with status badges. Quick agent triggers. |
| `/financial-snapshot` | **Financial Snapshot** | Tabbed view of all 6 source systems. Reconciliation flags and data gaps shown inline. |
| `/session-brief` | **Session Brief** | Full pipeline output — executive summary, key metrics, policy findings, IRS precedents, tax estimate. Expert review panel. |
| `/session-live/[clientId]` | **Live In-Session View** | Real-time AI assistance during active session. Intuit Assistant panel, live RAG lookups, toggleable tax estimate, governance ACTION flags. |
| `/policy-review` | **Policy Review** | Full policy evaluation report. Findings by area with confidence scores. Deduction opportunities. Compliance deadlines. |
| `/precedents` | **IRS Precedent Library** | Searchable precedent store. Find-similar-cases from any policy finding. Case detail modal. |
| `/tax-estimate` | **Tax Estimate** | Three-scenario model with interactive assumption toggles. Prior year comparison chart. Quarterly payment schedule. Disclaimer banner. |
| `/governance` | **Governance Log** | Full audit log with filter by agent/risk level. Pending approvals panel. Approve/Reject buttons. Auto-refreshes every 10s. |
| `/agents` | **Agent Control Panel** | Per-agent run buttons with live output previews. Dependency flow diagram. Use-case labels for each agent. |

---

## 8. API Route Map

All routes are Next.js App Router API routes (`src/app/api/...`). All return JSON.

```
Expert Routes
GET  /api/expert/sessions           — Marcus's session queue for today
GET  /api/expert/session/[id]       — single session detail with status

DAS Routes
POST /api/das/snapshot              — generate snapshot for clientId
GET  /api/das/snapshot?clientId=... — retrieve cached snapshot
GET  /api/das/systems               — list source system connection status

Assistant Routes
POST /api/assistant/chat            — send message, get response + agent routing

Agent Routes
POST /api/agents/summarizer         — generate FinancialSummary from snapshot
POST /api/agents/policy             — run PolicyEvaluationReport
POST /api/agents/rag                — retrieve IRS precedents for a query
POST /api/agents/tax-classifier     — generate TaxEstimate
POST /api/agents/orchestrate        — run full pipeline (DAS → all agents)

Governance Routes
POST /api/governance/classify       — classify action by risk level
POST /api/governance/approve        — expert approves/rejects an ACTION item
GET  /api/governance/log            — retrieve audit log
GET  /api/governance/pending        — retrieve pending approvals
```

---

## 9. Directory Structure

```
atlas/
  src/
    app/
      api/
        expert/
          sessions/route.ts         ← Marcus's session queue
          session/[id]/route.ts     ← Single session detail
        das/
          snapshot/route.ts
          systems/route.ts
        assistant/
          chat/route.ts
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
        page.tsx                    ← Dashboard (Expert Work Queue)
        financial-snapshot/page.tsx
        session-brief/page.tsx
        session-live/
          [clientId]/page.tsx       ← Live In-Session View
        policy-review/page.tsx
        precedents/page.tsx
        tax-estimate/page.tsx
        governance/page.tsx
        agents/page.tsx
      layout.tsx
      globals.css
    agents/
      das.ts
      intuit-assistant.ts
      summarizer-agent.ts
      policy-evaluation-agent.ts
      rag-agent.ts
      tax-classifier-agent.ts
      governance-agent.ts
    services/
      orchestrator.ts
      governance-store.ts
    data/
      mock/
        quickbooks.ts
        adp-payroll.ts
        expensify.ts
        stripe.ts
        inventory.ts
        prior-tax-returns.ts
        irs-precedents.ts
        irs-policy-docs.ts
        expert-sessions.ts          ← Marcus Rivera profile + session queue
      types/
        snapshot.ts
        agents.ts
        governance.ts
    components/
      ui/
      layout/
        Sidebar.tsx
        Header.tsx
        AppShell.tsx
      agents/
        AssistantPanel.tsx
      dashboard/
  .env.local
  package.json
  tailwind.config.ts
  tsconfig.json
```

---

## 10. Mock Data Schemas

### Marcus Rivera — Expert Profile

```typescript
{
  expertId: 'exp-marcus-001',
  name: 'Marcus Rivera',
  credentials: ['CPA', 'QuickBooks ProAdvisor Certified', 'TurboTax Live Business Certified'],
  yearsWithIntuit: 4,
  specialty: 'SMB accounting, S-Corp tax, payroll compliance',
  csatTrailing30Days: 4.87,
  atlasAdoptionRate: 0.94,
}
```

### Today's Session Queue

| Time | Client | Entity | Topic | Status |
|---|---|---|---|---|
| 9:00 AM | Apex Landscaping LLC | S-Corp | Payroll review | Completed |
| 10:30 AM | Blue Ridge Bakery | Sole Proprietor | Schedule C review | Completed |
| 12:00 PM | TechStart Consulting | LLC | Quarterly close | Completed |
| 2:00 PM | **Meridian Home Goods / Sarah Chen** | S-Corp | Q4 tax readiness | **In Progress** |
| 3:30 PM | Riviera Salon Group | S-Corp | Payroll tax compliance | Prep Ready |
| 4:30 PM | NextGen Fitness | C-Corp | Year-end close | Not Started |

### Meridian Home Goods — Financial Profile

| Metric | Value |
|---|---|
| Entity type | S-Corporation |
| State | California |
| Tax year | 2025 |
| Annual revenue (Stripe) | $12.4M |
| QuickBooks net income YTD | $1.87M |
| Total payroll (ADP) | $3.2M / 85 employees |
| Total approved expenses (Expensify) | $284K |
| Flagged expenses | $42K (personal/business ambiguous) |
| Inventory value (end of Q3) | $1.1M |
| Prior year effective tax rate | 21.3% |
| Prior year carryforward loss | $0 (profitable 3 years running) |

### IRS Precedent Records (8 required)

| Case | Topic | Outcome | Keywords |
|---|---|---|---|
| TC-2019-0124 | Contractor misclassification | **Taxpayer LOST** — $180K assessment | 1099, contractor, employee |
| TC-2021-0087 | S-Corp reasonable compensation | **Taxpayer LOST** — salary recharacterized | S-Corp, distributions, FICA |
| TC-2020-0203 | Home office deduction (IRC 280A) | **Taxpayer LOST** — deduction denied | home office, 280A, exclusive use |
| TC-2018-0156 | Meals & entertainment (IRC 274) | **Taxpayer LOST** — entertainment disallowed | meals, entertainment, 274 |
| TC-2022-0041 | Section 179 recapture | **Taxpayer LOST** — recapture assessed | Section 179, recapture, disposal |
| IRS-LTR-2020-0389 | FTD penalty first-time abatement | **Taxpayer WON** — penalties waived | payroll deposit, FTD, 941 |
| TC-2021-0178 | QBI deduction SSTB exclusion | **Taxpayer LOST** — QBI deduction denied | 199A, QBI, specified service |
| TC-2023-0062 | Inventory write-down | **Taxpayer WON** — write-down accepted | inventory, write-down, COGS |

---

## 11. Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key (for Claude AI features)

### Installation

```bash
cd atlas
npm install
```

### Environment Setup

Create `atlas/.env.local`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_URL=your_neon_postgres_url_here   # optional for prototype
```

> **Without an API key:** The app runs fully on mock data. Agent triggers work with deterministic outputs. The Intuit Assistant chat will show a connection error.

### Running Locally

```bash
cd atlas
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Walkthrough

Walk through this sequence to demonstrate the full VEP story:

1. **Dashboard** — Show Marcus Rivera's work queue. 6 sessions today, Sarah Chen's at 2 PM is in progress.
2. **Click "Generate Session Brief"** — Watch the full pipeline run (DAS → all agents in ~2s).
3. **Session Brief** — Show what Marcus sees before the session: complete, confidence-scored, ready.
4. **Live Session View** — Show real-time AI assistance: Intuit Assistant answering "Is her home office deductible?", RAG surfacing precedents inline.
5. **Policy Review** — Show contractor misclassification flag with TC-2019-0124 precedent attached.
6. **Tax Estimate** — Show three scenarios, toggle a deduction off to see real-time impact.
7. **Governance** — Show audit log and an ACTION item pending Marcus's approval before it reaches Sarah.
8. **Agent Control Panel** — Show individual agent triggers and live output previews.

**The demo arc:** *Data fragmentation → aggregation → AI-powered analysis → human expert confirmation → governed audit trail. That is the VEP story.*

---

## Design Guidelines

- **Color palette:** `#0077C5` (Intuit blue, primary) · `#FF6900` (Intuit orange, accent) · `#F1F5F9` (page background) · `#FFFFFF` (card background)
- **Typography:** Inter (Google Fonts) — clean, professional, financial-grade
- **Agent panels:** Always show agent name badge, confidence score, timestamp, and "Requires Expert Review" badge when applicable
- **Monetary values:** USD with commas (e.g. `$1,870,000`)
- **Percentages:** 1 decimal place (e.g. `21.3%`)
- **Governance:** Tax estimates must always show the disclaimer banner — never suppress it
- **Responsive:** Single-column on mobile, sidebar drawer on tablet, full layout on desktop (lg+)
