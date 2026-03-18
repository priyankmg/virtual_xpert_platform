export interface KeyMetric {
  label: string;
  value: string;
  trend: 'UP' | 'DOWN' | 'FLAT';
  benchmark?: string;
}

export interface AttentionItem {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  source: string;
}

export interface FinancialSummary {
  executiveSummary: string;
  keyMetrics: KeyMetric[];
  attentionItems: AttentionItem[];
  readyForExpertSession: boolean;
  estimatedSessionPrepTime: string;
  generatedAt: string;
  audienceType: 'expert' | 'client';
}

export interface PolicyFinding {
  area: string;
  finding: string;
  policyReference: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  requiresExpertReview: boolean;
}

export interface DeductionOpportunity {
  description: string;
  estimatedValue: number;
  confidence: number;
  policyReference: string;
}

export interface ComplianceGap {
  description: string;
  deadline: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PolicyEvaluationReport {
  evaluationDate: string;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  findings: PolicyFinding[];
  deductionOpportunities: DeductionOpportunity[];
  complianceGaps: ComplianceGap[];
  expertReviewRequired: boolean;
}

export interface IRSPrecedent {
  id: string;
  title: string;
  year: number;
  topic: string;
  keyFacts: string;
  ruling: string;
  relevanceKeywords: string[];
  citationId: string;
  relevanceScore?: number;
  rulingSummary?: string;
  taxpayerOutcome?: string;
  applicabilityNote?: string;
}

export interface RAGResult {
  query: string;
  precedents: (IRSPrecedent & {
    relevanceScore: number;
    rulingSummary: string;
    taxpayerOutcome: string;
    applicabilityNote: string;
  })[];
  sourcesRetrieved: number;
  confidenceInRelevance: number;
}

export interface TaxScenario {
  federalTaxableIncome: number;
  federalTax: number;
  stateTax: number;
  selfEmploymentTax: number;
  totalLiability: number;
  keyAssumptions: string[];
}

export interface TaxEstimate {
  taxYear: number;
  entityType: 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole Proprietor';
  scenarios: {
    conservative: TaxScenario;
    base: TaxScenario;
    optimistic: TaxScenario;
  };
  quarterlyPaymentsRequired: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  priorYearComparison: {
    priorLiability: number;
    change: number;
    changePercent: number;
  };
  expertReviewRecommended: boolean;
  confidenceScore: number;
  disclaimer: string;
  generatedAt: string;
}

export interface OrchestratorResult {
  snapshot: import('./snapshot').ClientFinancialSnapshot;
  summary: FinancialSummary;
  policyReport: PolicyEvaluationReport;
  ragResult: RAGResult;
  taxEstimate: TaxEstimate;
  completedAt: string;
  totalDurationMs: number;
}
