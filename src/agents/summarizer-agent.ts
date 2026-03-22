import Anthropic from '@anthropic-ai/sdk';
import { ClientFinancialSnapshot } from '../data/types/snapshot';
import { FinancialSummary } from '../data/types/agents';
import { logAgentAction } from '../services/governance-store';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildMockSummary(snapshot: ClientFinancialSnapshot, audienceType: 'expert' | 'client'): FinancialSummary {
  const netMargin = ((snapshot.accounting.netIncome / snapshot.accounting.revenue) * 100).toFixed(1);
  const flaggedExpenseRate = ((snapshot.expenses.flagged / snapshot.expenses.total) * 100).toFixed(1);

  return {
    executiveSummary: audienceType === 'expert'
      ? `Meridian Home Goods shows strong YTD performance with $12.4M revenue and $1.87M net income (${netMargin}% net margin), tracking above prior-year levels. However, $42K in flagged expenses, 4 contractor relationships requiring classification review, and a $148K Stripe/QuickBooks revenue reconciliation gap require expert attention before filing. Tax liability is estimated at $580K–$680K across three scenarios, with QBI deduction eligibility potentially reducing the base scenario by up to $86K.`
      : `Your business is performing well this year — revenue is up and your net income is solid at $1.87M. There are a few items we want to review with your expert before you file, including some expenses that may need documentation and a question about how some team members are classified. Your estimated tax bill for the year ranges from $580K to $680K depending on which deductions apply.`,
    keyMetrics: [
      { label: 'Revenue YTD', value: '$12,400,000', trend: 'UP', benchmark: '+15.3% vs. prior year' },
      { label: 'Net Income', value: '$1,870,000', trend: 'UP', benchmark: `${netMargin}% net margin` },
      { label: 'Total Payroll', value: '$3,200,000', trend: 'FLAT', benchmark: '25.8% of revenue' },
      { label: 'Gross Profit Margin', value: '45.0%', trend: 'UP', benchmark: 'Industry avg: 42%' },
      { label: 'Flagged Expenses', value: '$42,000', trend: 'UP', benchmark: `${flaggedExpenseRate}% of total expenses` },
      { label: 'Estimated Tax Liability', value: '$580K–$680K', trend: 'UP', benchmark: '+12% vs. prior year' },
    ],
    attentionItems: [
      { severity: 'HIGH', description: 'Revenue reconciliation gap: Stripe shows $148K more than QuickBooks recognized revenue. Likely deferred revenue but needs confirmation.', source: 'Stripe / QuickBooks' },
      { severity: 'HIGH', description: '4 contractor payments totaling $184K — risk of worker misclassification under IRS common-law test. See TC-2019-0124.', source: 'ADP Payroll' },
      { severity: 'HIGH', description: '$18K in client entertainment expenses with no documented business purpose — likely 100% non-deductible post-TCJA.', source: 'Expensify' },
      { severity: 'MEDIUM', description: '$22K in home office claims across multiple employees — exclusive use documentation required per IRC 280A.', source: 'Expensify' },
      { severity: 'MEDIUM', description: 'December P&L not closed — tax estimates based on 11-month data plus projections.', source: 'QuickBooks' },
      { severity: 'MEDIUM', description: 'Inventory write-down of $48K requires contemporaneous FMV documentation to withstand audit.', source: 'Inventory System' },
      { severity: 'LOW', description: '2025 depreciation schedule for new asset additions not uploaded — Form 4562 continuity may be incomplete.', source: 'QuickBooks' },
    ],
    readyForExpertSession: true,
    estimatedSessionPrepTime: '< 5 minutes with Atlas',
    generatedAt: new Date().toISOString(),
    audienceType,
  };
}

export async function runSummarizerAgent(
  snapshot: ClientFinancialSnapshot,
  audienceType: 'expert' | 'client' = 'expert'
): Promise<FinancialSummary> {
  let summary: FinancialSummary;

  try {
    const snapshotContext = JSON.stringify({
      revenue: snapshot.accounting.revenue,
      netIncome: snapshot.accounting.netIncome,
      totalPayroll: snapshot.payroll.totalWages,
      flaggedExpenses: snapshot.expenses.flagged,
      reconciliationFlags: snapshot.reconciliationFlags,
      dataGaps: snapshot.dataGaps,
      priorYearEffectiveRate: snapshot.taxHistory.effectiveTaxRates[snapshot.taxHistory.effectiveTaxRates.length - 1]?.rate,
    }, null, 2);

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: `You are the Atlas Summarizer Agent for the Virtual Expert Platform. Your role is to create concise financial summaries for ${audienceType === 'expert' ? 'credentialed tax experts' : 'small business clients'}. Always identify when a response requires expert confirmation. Never state a tax position as definitive. Surface confidence scores. Flag data gaps that could affect accuracy.`,
      messages: [
        {
          role: 'user',
          content: `Generate a 3-sentence executive summary for this financial snapshot: ${snapshotContext}. Focus on performance, risks, and what the expert needs to review.`,
        },
      ],
    });

    const executiveSummary = message.content[0].type === 'text' ? message.content[0].text : '';
    const base = buildMockSummary(snapshot, audienceType);
    summary = { ...base, executiveSummary };
  } catch {
    summary = buildMockSummary(snapshot, audienceType);
  }

  logAgentAction({
    agentName: 'Summarizer Agent',
    actionType: 'ADVISORY',
    clientId: snapshot.clientId,
    inputSummary: `Financial snapshot for ${snapshot.clientName}, audience: ${audienceType}`,
    outputSummary: `Generated summary with ${summary.attentionItems.length} attention items. Ready for expert session: ${summary.readyForExpertSession}`,
    confidenceScore: 0.92,
    expertReviewRequired: true,
  });

  return summary;
}
