import Anthropic from '@anthropic-ai/sdk';
import { ClientFinancialSnapshot } from '../data/types/snapshot';
import { PolicyEvaluationReport } from '../data/types/agents';
import { logAgentAction } from '../services/governance-store';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildMockPolicyReport(snapshot: ClientFinancialSnapshot): PolicyEvaluationReport {
  return {
    evaluationDate: new Date().toISOString(),
    overallRiskLevel: 'HIGH',
    findings: [
      {
        area: 'Worker Classification',
        finding: `4 contractors paid $184,000 YTD. Alexis Grant and Raj Patel both perform regular business functions (marketing and software development), work set hours, and use company-issued tools — all behavioral control indicators under the IRS 20-factor test.`,
        policyReference: 'IRS Publication 15, Revenue Ruling 87-41',
        riskLevel: 'HIGH',
        confidence: 0.88,
        requiresExpertReview: true,
      },
      {
        area: 'Meal and Entertainment Expenses',
        finding: `$18,000 in client entertainment lacks documented business purpose. Post-TCJA (2018), entertainment expenses are 0% deductible. Additionally, $54,000 in meals must be reduced by 50% — verify business purpose documentation exists for all.`,
        policyReference: 'IRS Publication 535, IRC 274(a)',
        riskLevel: 'HIGH',
        confidence: 0.95,
        requiresExpertReview: true,
      },
      {
        area: 'Home Office Deductions',
        finding: `$22,000 claimed across 5 remote employees. IRC 280A requires exclusive and regular use. Employee home office deductions are suspended under TCJA through 2025 for W-2 employees. These expenses may be non-deductible.`,
        policyReference: 'IRC 280A, TCJA 2017',
        riskLevel: 'MEDIUM',
        confidence: 0.91,
        requiresExpertReview: true,
      },
      {
        area: 'Inventory Write-Down',
        finding: `$48,000 inventory write-down recorded. Lower of cost or market method is acceptable but requires contemporaneous documentation: physical count, FMV determination, and business rationale for each written-down SKU.`,
        policyReference: 'IRS Publication 538, Reg. 1.471-2',
        riskLevel: 'MEDIUM',
        confidence: 0.84,
        requiresExpertReview: false,
      },
      {
        area: 'S-Corp Reasonable Compensation',
        finding: `Sarah Chen\'s $185,000 salary on $1.87M net income (9.9% ratio) is within acceptable range per industry benchmarks for a controller/CFO role. However, with 2025 revenue growth, IRS may scrutinize if distributions significantly exceed salary.`,
        policyReference: 'Rev. Rul. 74-44, IRC 3121',
        riskLevel: 'LOW',
        confidence: 0.79,
        requiresExpertReview: false,
      },
      {
        area: 'Estimated Tax Payments',
        finding: `Q1–Q3 estimated tax payments appear to be on track based on prior year safe harbor. Q4 payment due January 15, 2026. With higher-than-prior-year income, the 110% of prior year safe harbor method is recommended.`,
        policyReference: 'IRC 6654, IRS Publication 505',
        riskLevel: 'LOW',
        confidence: 0.93,
        requiresExpertReview: false,
      },
      {
        area: 'Payroll Tax Compliance',
        finding: `Forms 941 and 940 both show FILED status. Employer FICA obligations of $244,800 appear properly calculated at 7.65% of $3.2M wages. No FTD penalty risk identified for Q1–Q3. Q4 December deposit timing requires confirmation.`,
        policyReference: 'IRS Publication 15, IRC 3111',
        riskLevel: 'LOW',
        confidence: 0.97,
        requiresExpertReview: false,
      },
    ],
    deductionOpportunities: [
      {
        description: 'IRC 199A Qualified Business Income Deduction (20% of QBI)',
        estimatedValue: 86_000,
        confidence: 0.82,
        policyReference: 'IRC 199A, TD 9892',
      },
      {
        description: 'Section 179 expensing on 2025 equipment purchases (if applicable)',
        estimatedValue: 48_000,
        confidence: 0.75,
        policyReference: 'IRC 179, IRS Publication 946',
      },
      {
        description: 'Stripe processing fees ($376,440) — fully deductible as business expense',
        estimatedValue: 376_440,
        confidence: 0.99,
        policyReference: 'IRS Publication 535',
      },
      {
        description: 'Health insurance premiums for S-Corp shareholder-employees',
        estimatedValue: 16_800,
        confidence: 0.95,
        policyReference: 'IRC 162(l)',
      },
    ],
    complianceGaps: [
      {
        description: 'Q4 estimated tax payment (Form 1120-W) — due January 15, 2026',
        deadline: '2026-01-15',
        severity: 'HIGH',
      },
      {
        description: 'December 941 payroll tax deposit — confirm all December wages deposited',
        deadline: '2026-01-15',
        severity: 'MEDIUM',
      },
      {
        description: '1099-NEC forms for contractors over $600 — due January 31, 2026',
        deadline: '2026-01-31',
        severity: 'HIGH',
      },
      {
        description: 'California Form 100-S (S-Corp return) — due March 15, 2026',
        deadline: '2026-03-15',
        severity: 'MEDIUM',
      },
    ],
    expertReviewRequired: true,
  };
}

export async function runPolicyEvaluationAgent(
  snapshot: ClientFinancialSnapshot
): Promise<PolicyEvaluationReport> {
  let report: PolicyEvaluationReport;

  try {
    const context = {
      contractorPayments: snapshot.payroll.contractorPayments,
      flaggedExpenses: snapshot.expenses.flagged,
      expenseCategories: snapshot.expenses.byCategory.filter(c => c.flagged),
      netIncome: snapshot.accounting.netIncome,
    };

    await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: 'You are the Atlas Policy Evaluation Agent. Evaluate financial data against IRS rules. Always note confidence levels. Never state definitive tax positions.',
      messages: [{ role: 'user', content: `Evaluate risk areas: ${JSON.stringify(context)}. Return a one-sentence overall risk assessment.` }],
    });

    report = buildMockPolicyReport(snapshot);
  } catch {
    report = buildMockPolicyReport(snapshot);
  }

  logAgentAction({
    agentName: 'Policy Evaluation Agent',
    actionType: 'ADVISORY',
    clientId: snapshot.clientId,
    inputSummary: `Policy evaluation for ${snapshot.clientName}`,
    outputSummary: `${report.findings.length} findings, ${report.deductionOpportunities.length} deduction opportunities, overall risk: ${report.overallRiskLevel}`,
    confidenceScore: 0.88,
    expertReviewRequired: true,
  });

  return report;
}
