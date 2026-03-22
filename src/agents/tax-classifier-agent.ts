import { ClientFinancialSnapshot } from '../data/types/snapshot';
import { TaxEstimate, TaxScenario } from '../data/types/agents';
import { logAgentAction } from '../services/governance-store';

function calcFederalTax(taxableIncome: number): number {
  // 2025 S-Corp pass-through — simplified individual brackets for owner
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 44_725) return taxableIncome * 0.22;
  if (taxableIncome <= 95_375) return 9_839.50 + (taxableIncome - 44_725) * 0.24;
  if (taxableIncome <= 201_050) return 22_035.50 + (taxableIncome - 95_375) * 0.32;
  if (taxableIncome <= 383_900) return 55_849.50 + (taxableIncome - 201_050) * 0.35;
  return 119_847 + (taxableIncome - 383_900) * 0.37;
}

function calcCaliforniaTax(taxableIncome: number): number {
  // California 2025 marginal rates (simplified)
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 66_295) return taxableIncome * 0.093;
  if (taxableIncome <= 338_639) return 6_165.44 + (taxableIncome - 66_295) * 0.103;
  return 34_209 + (taxableIncome - 338_639) * 0.113;
}

export async function runTaxClassifierAgent(snapshot: ClientFinancialSnapshot): Promise<TaxEstimate> {
  const baseNetIncome = snapshot.accounting.netIncome; // $1,870,000
  const qbiDeduction = baseNetIncome * 0.20 * 0.82; // ~20% QBI, confidence adjusted
  const mealDisallowance = snapshot.expenses.byCategory
    .filter(c => c.category.includes('Meal'))
    .reduce((sum, c) => sum + c.amount * 0.5, 0);

  const entertainmentDisallowance = snapshot.expenses.byCategory
    .filter(c => c.flagged && c.deductiblePercent === 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const contractorRisk = snapshot.payroll.contractorPayments * 0.5; // partial reclass risk

  function buildScenario(
    addbacks: number,
    applyQBI: boolean,
    label: string
  ): TaxScenario {
    const federalTaxableIncome = baseNetIncome + addbacks - (applyQBI ? qbiDeduction : 0);
    const federalTax = calcFederalTax(federalTaxableIncome);
    const stateTax = calcCaliforniaTax(federalTaxableIncome);
    const selfEmploymentTax = 0; // S-Corp — no SE tax on distributions

    return {
      federalTaxableIncome: Math.round(federalTaxableIncome),
      federalTax: Math.round(federalTax),
      stateTax: Math.round(stateTax),
      selfEmploymentTax,
      totalLiability: Math.round(federalTax + stateTax),
      keyAssumptions: label.split('|'),
    };
  }

  const conservative = buildScenario(
    mealDisallowance + entertainmentDisallowance + contractorRisk,
    false,
    'All flagged deductions disallowed|No QBI deduction|Contractor reclassification risk included|50% meal disallowance applied'
  );

  const base = buildScenario(
    mealDisallowance + entertainmentDisallowance,
    true,
    'Entertainment expenses disallowed|50% meal limit applied|QBI deduction at 20%|Contractors classified as-is'
  );

  const optimistic = buildScenario(
    0,
    true,
    'All identified deductions realized|QBI deduction applied in full|All expenses substantiated|Section 179 elections maximized'
  );

  const priorYearLiability = snapshot.taxHistory.priorYearReturns[0]?.federalTax + snapshot.taxHistory.priorYearReturns[0]?.stateTax || 474_660;

  const estimate: TaxEstimate = {
    taxYear: 2025,
    entityType: 'S-Corp',
    scenarios: { conservative, base, optimistic },
    quarterlyPaymentsRequired: {
      q1: Math.round(base.totalLiability * 0.25),
      q2: Math.round(base.totalLiability * 0.25),
      q3: Math.round(base.totalLiability * 0.25),
      q4: Math.round(base.totalLiability * 0.25),
    },
    priorYearComparison: {
      priorLiability: priorYearLiability,
      change: base.totalLiability - priorYearLiability,
      changePercent: Math.round(((base.totalLiability - priorYearLiability) / priorYearLiability) * 1000) / 10,
    },
    expertReviewRecommended: true,
    confidenceScore: 0.81,
    disclaimer: 'This estimate is for planning purposes only and does not constitute tax advice. Consult your CPA or a qualified tax professional before making any tax filing decisions.',
    generatedAt: new Date().toISOString(),
  };

  logAgentAction({
    agentName: 'Tax Estimation Classifier',
    actionType: 'ADVISORY',
    clientId: snapshot.clientId,
    inputSummary: `Tax estimate for ${snapshot.clientName}, tax year 2025`,
    outputSummary: `Base: $${base.totalLiability.toLocaleString()} | Conservative: $${conservative.totalLiability.toLocaleString()} | Optimistic: $${optimistic.totalLiability.toLocaleString()}`,
    confidenceScore: 0.81,
    expertReviewRequired: true,
  });

  return estimate;
}
