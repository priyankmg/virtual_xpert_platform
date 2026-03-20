import Anthropic from '@anthropic-ai/sdk';
import { generateSnapshot, getCachedSnapshot } from './das';
import { runSummarizerAgent } from './summarizer-agent';
import { runPolicyEvaluationAgent } from './policy-evaluation-agent';
import { runRAGAgent } from './rag-agent';
import { runTaxClassifierAgent } from './tax-classifier-agent';
import { logAgentAction } from '../services/governance-store';

type IntentCategory =
  | 'SNAPSHOT_QUERY'
  | 'SUMMARY_REQUEST'
  | 'POLICY_CHECK'
  | 'PRECEDENT_LOOKUP'
  | 'TAX_ESTIMATE'
  | 'GENERAL';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  response: string;
  agentRouted: string;
  requiresExpertReview: boolean;
}

function classifyIntent(message: string): IntentCategory {
  const lower = message.toLowerCase();
  if (lower.includes('snapshot') || lower.includes('balance') || lower.includes('revenue') || lower.includes('payroll data')) return 'SNAPSHOT_QUERY';
  if (lower.includes('summar') || lower.includes('overview') || lower.includes('brief') || lower.includes('financial position')) return 'SUMMARY_REQUEST';
  if (lower.includes('compliance') || lower.includes('deduct') || lower.includes('policy') || lower.includes('contractor') || lower.includes('classification') || lower.includes('home office')) return 'POLICY_CHECK';
  if (lower.includes('precedent') || lower.includes('case') || lower.includes('ruling') || lower.includes('audit') || lower.includes('irs decision')) return 'PRECEDENT_LOOKUP';
  if (lower.includes('tax') || lower.includes('liability') || lower.includes('estimate') || lower.includes('owe') || lower.includes('q4') || lower.includes('quarterly')) return 'TAX_ESTIMATE';
  return 'GENERAL';
}

const AGENT_LABELS: Record<IntentCategory, string> = {
  SNAPSHOT_QUERY: 'Data Aggregation Service',
  SUMMARY_REQUEST: 'Summarizer Agent',
  POLICY_CHECK: 'Policy Evaluation Agent',
  PRECEDENT_LOOKUP: 'RAG Agent',
  TAX_ESTIMATE: 'Tax Classifier Agent',
  GENERAL: 'Intuit Assistant',
};

// ── Curated mock responses used when the API key is missing or invalid ────────
const MOCK_RESPONSES: Record<IntentCategory, (context: string) => string> = {
  TAX_ESTIMATE: () =>
    `Based on the Atlas tax estimate for Meridian Home Goods:

**Base Case: $287,600** (recommended planning figure)
- Conservative scenario (all flagged deductions disallowed): $312,400
- Optimistic scenario (all deductions realized + full QBI): $241,800

**Q4 estimated payment due January 15: $78,400**

Key assumptions in the base case: 50% meal expense limit applied, entertainment expenses disallowed per IRC §274, QBI deduction claimed at current income level, and Section 179 elected on the delivery van ($38K).

Prior year effective rate was 21.3% — base scenario implies ~21.8%, within normal range given revenue growth.

⚠️ Requires expert review before sharing with Sarah. Prior year carryforward loss: $0.`,

  POLICY_CHECK: () =>
    `Policy Evaluation Agent identified 3 priority findings for Meridian Home Goods:

**HIGH RISK — Contractor Misclassification**
2 of 7 contractors fail the behavioral and economic control tests under IRC §3401. Per TC-2019-0124, IRS assessed $180K in back FICA and penalties for a comparable S-Corp. Retroactive exposure estimated at $38K–$54K.
→ Recommend reclassifying as W-2 employees before year-end.

**HIGH RISK — Flagged Expensify Expenses ($42K)**
$42,000 in expense reports lack business purpose documentation. Risk of full disallowance under IRC §274 if audited.
→ Request receipts and written business purpose before filing.

**MEDIUM — S-Corp Reasonable Compensation**
Owner salary of $95K is within benchmark range but should be documented annually. See TC-2021-0087.

⚠️ All HIGH risk items require expert confirmation before surfacing to Sarah.`,

  PRECEDENT_LOOKUP: () =>
    `RAG Agent retrieved 3 relevant IRS precedents for Meridian Home Goods:

**TC-2019-0124** — Contractor misclassification. Taxpayer LOST. $180K assessment. IRS reclassified 3 contractors as employees; employer owed back FICA, FUTA, and penalties. High relevance to Meridian's situation.

**TC-2021-0087** — S-Corp reasonable compensation. Taxpayer LOST. IRS recharacterized distributions as wages when owner salary was below market rate.

**TC-2020-0203** — Home office deduction (IRC §280A). Taxpayer LOST. Deduction denied because mixed-use space did not satisfy exclusive use requirement.

For full precedent details, visit the IRS Precedent Library page.`,

  SNAPSHOT_QUERY: () =>
    `Current financial snapshot for Meridian Home Goods (via DAS):

**Revenue (Stripe):** $12,400,000 YTD (+18% vs prior year)
**Net Income (QuickBooks):** $1,870,000 YTD (+12%)
**Total Payroll (ADP):** $3,200,000 (85 employees)
**Approved Expenses (Expensify):** $284,000
**Flagged Expenses:** $42,000 (personal/business ambiguous)
**Inventory Value (Q3 end):** $1,100,000
**Prior Year Effective Tax Rate:** 21.3%

3 reconciliation flags: Stripe vs QuickBooks revenue delta ($148K), Inventory vs QuickBooks COGS delta ($560K), and 1 ADP payroll period with incorrect FICA withholding.`,

  SUMMARY_REQUEST: () =>
    `Financial summary for Meridian Home Goods — Q4 2025:

Meridian is entering Q4 in a strong position with $1.87M net income YTD (+12% over prior year), driven by $12.4M in Stripe revenue. Three material risks require expert attention:

1. **Contractor misclassification** — 2 workers with estimated FICA exposure of $38K–$54K
2. **$42K in flagged expenses** — ambiguous business purpose, disallowance risk
3. **Q4 estimated tax payment** — $78,400 due January 15, 2026

Session readiness: ✅ All 6 source systems aggregated. Expert review recommended before client delivery.`,

  GENERAL: () =>
    `I'm the Intuit Assistant for this Atlas session. I can help Marcus prepare for the Meridian Home Goods session with:

- **Tax liability questions** — "What is Sarah's Q4 estimated tax?"
- **Policy & compliance** — "Flag any payroll compliance issues"
- **IRS precedents** — "Find cases related to contractor classification"
- **Financial overview** — "Summarize her financial position"
- **Session prep** — "What are the top 3 items to cover today?"

What would you like to explore?`,
};

// ── Main chat function ─────────────────────────────────────────────────────────
export async function chat(messages: ChatMessage[], clientId: string): Promise<ChatResult> {
  const lastMessage = messages[messages.length - 1]?.content ?? '';
  const intent = classifyIntent(lastMessage);
  const agentRouted = AGENT_LABELS[intent];

  let contextData = '';

  // Try to gather live agent context (this works without API key)
  try {
    if (intent === 'SNAPSHOT_QUERY') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      contextData = `Revenue: $${snapshot.accounting.revenue.toLocaleString()}, Net Income: $${snapshot.accounting.netIncome.toLocaleString()}, Payroll: $${snapshot.payroll.totalWages.toLocaleString()}, Flagged Expenses: $${snapshot.expenses.flagged.toLocaleString()}`;
    } else if (intent === 'TAX_ESTIMATE') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      const estimate = await runTaxClassifierAgent(snapshot);
      contextData = `Tax Estimate — Base: $${estimate.scenarios.base.totalLiability.toLocaleString()}, Conservative: $${estimate.scenarios.conservative.totalLiability.toLocaleString()}, Optimistic: $${estimate.scenarios.optimistic.totalLiability.toLocaleString()}. Q4 payment: $${estimate.quarterlyPaymentsRequired.q4.toLocaleString()}. Confidence: ${(estimate.confidenceScore * 100).toFixed(0)}%`;
    } else if (intent === 'POLICY_CHECK') {
      const snapshot = getCachedSnapshot(clientId) ?? await generateSnapshot(clientId);
      const report = await runPolicyEvaluationAgent(snapshot);
      const highRisk = report.findings.filter(f => f.riskLevel === 'HIGH');
      contextData = `Policy findings (${report.overallRiskLevel} overall risk): ${highRisk.map(f => `${f.area}: ${f.finding.slice(0, 120)}`).join('; ')}`;
    } else if (intent === 'PRECEDENT_LOOKUP') {
      const ragResult = await runRAGAgent(lastMessage, clientId);
      contextData = `IRS precedents:\n${ragResult.precedents.slice(0, 3).map(p => `${p.title} (${p.year}): ${p.rulingSummary}`).join('\n')}`;
    }
  } catch {
    // Context gathering failed — continue without it
  }

  const systemPrompt = `You are the Intuit Assistant for Atlas, a Virtual Expert Platform for financial accounting. You are helping Marcus Rivera (CPA, QuickBooks ProAdvisor) prepare for an expert session with Sarah Chen, Controller at Meridian Home Goods (S-Corp, $12.4M revenue, 85 employees, California).

${contextData ? `Data from Atlas agents (intent: ${intent}):\n${contextData}\n` : ''}

Rules:
- Always identify when a response requires expert confirmation before being shared with Sarah
- Never state a tax position as definitive — frame as "based on the data available"
- Be concise, professional, and financial-grade in tone
- If quoting dollar amounts, use commas (e.g. $287,600)
- Flag any data gaps that could affect accuracy`;

  // Try the Anthropic API — fall back to mock if key is missing or invalid
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'your_anthropic_api_key_here' && apiKey.startsWith('sk-ant-');

  let response: string;

  if (hasValidKey) {
    try {
      const anthropic = new Anthropic({ apiKey });
      const result = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      response = result.content[0].type === 'text' ? result.content[0].text : MOCK_RESPONSES[intent](contextData);
    } catch {
      // API call failed (rate limit, network, etc.) — use mock
      response = MOCK_RESPONSES[intent](contextData);
    }
  } else {
    // No valid key — return curated mock response for the detected intent
    response = MOCK_RESPONSES[intent](contextData);
  }

  const requiresExpertReview = intent === 'POLICY_CHECK' || intent === 'TAX_ESTIMATE';

  logAgentAction({
    agentName: 'Intuit Assistant',
    actionType: 'ADVISORY',
    clientId,
    inputSummary: `Chat message (intent: ${intent}): "${lastMessage.slice(0, 80)}"`,
    outputSummary: response.slice(0, 100),
    confidenceScore: hasValidKey ? 0.92 : 0.78,
    expertReviewRequired: requiresExpertReview,
  });

  return { response, agentRouted, requiresExpertReview };
}
