// Admin / product-team platform engagement metrics (mock data)

export interface UserFunnelStage {
  label: string;
  sublabel: string;
  count: number;
  pctOfPrev: number | null; // null for first stage
  pctOfTotal: number;
  color: string;
}

export interface FeatureUsageStat {
  name: string;
  route: string;
  views: number;
  uniqueUsers: number;
  trend: 'up' | 'down' | 'stable';
  trendPct: number;
  isNew?: boolean;
}

export interface AgentUsageStat {
  name: string;
  key: string;
  description: string;
  totalCalls: number;
  perSessionAvg: number;
  avgConfidenceScore: number; // 0–1
  successRate: number;        // 0–1
  trend: 'up' | 'down' | 'stable';
}

export interface PolicyOverrideDetail {
  actionType: string;
  overrideCount: number;
  totalCount: number;
  exampleClient: string;
}

export interface RiskOverrideStat {
  total: number;
  approved: number;
  overridden: number;
  approvalRateThreshold: number; // minimum expected approval rate (e.g. 0.75 for HIGH)
  commonOverrides: PolicyOverrideDetail[];
}

export interface MonthlyConfidence {
  month: string;
  avgConfidence: number;  // 0–1
  overrideRate: number;   // 0–1 (lower = AI better trusted)
  totalActions: number;
}

export interface PlatformMetrics {
  asOf: string;
  periodLabel: string;

  // User adoption funnel
  totalInvited: number;
  funnel: UserFunnelStage[];

  // Feature usage
  topFeatures: FeatureUsageStat[];
  bottomFeatures: FeatureUsageStat[];

  // AI agent usage
  totalSessionsInPeriod: number;
  agentUsage: AgentUsageStat[];

  // Policy override analysis by risk
  policyOverrides: {
    HIGH: RiskOverrideStat;
    MEDIUM: RiskOverrideStat;
    LOW: RiskOverrideStat;
  };

  // Monthly AI confidence trend (last 6 months)
  confidenceTrend: MonthlyConfidence[];
}

export const platformMetrics: PlatformMetrics = {
  asOf: '2025-03-18',
  periodLabel: 'Last 30 Days',

  totalInvited: 142,
  funnel: [
    {
      label: 'Invited / Signed Up',
      sublabel: 'Accounts provisioned',
      count: 142,
      pctOfPrev: null,
      pctOfTotal: 100,
      color: '#0077C5',
    },
    {
      label: 'Activated',
      sublabel: 'Logged in at least once',
      count: 118,
      pctOfPrev: 83,
      pctOfTotal: 83,
      color: '#0099E6',
    },
    {
      label: 'Onboarded',
      sublabel: 'Completed ≥1 session brief',
      count: 94,
      pctOfPrev: 80,
      pctOfTotal: 66,
      color: '#00B8D9',
    },
    {
      label: 'Active This Month',
      sublabel: 'Used Atlas in last 30 days',
      count: 76,
      pctOfPrev: 81,
      pctOfTotal: 54,
      color: '#36B37E',
    },
    {
      label: 'Retained (Returning)',
      sublabel: 'Active in both this & last month',
      count: 61,
      pctOfPrev: 80,
      pctOfTotal: 43,
      color: '#00875A',
    },
    {
      label: 'At Risk / Inactive',
      sublabel: 'No login in 30+ days',
      count: 18,
      pctOfPrev: null,
      pctOfTotal: 13,
      color: '#FF8B00',
    },
    {
      label: 'Churned',
      sublabel: 'No login in 60+ days',
      count: 24,
      pctOfPrev: null,
      pctOfTotal: 17,
      color: '#DE350B',
    },
  ],

  topFeatures: [
    { name: 'Session Prep (AI Brief)',  route: '/session-prep', views: 312, uniqueUsers: 68, trend: 'up',     trendPct: 24 },
    { name: 'Work Queue / Dashboard',   route: '/',             views: 289, uniqueUsers: 76, trend: 'up',     trendPct: 11 },
    { name: 'Financial Snapshot',       route: '/financial-snapshot', views: 214, uniqueUsers: 59, trend: 'up', trendPct: 18 },
    { name: 'Atlas Assistant (Chat)',  route: '/session-live', views: 187, uniqueUsers: 52, trend: 'up',     trendPct: 32 },
    { name: 'Policy Review',            route: '/policy-review', views: 163, uniqueUsers: 48, trend: 'stable', trendPct: 2, },
  ],

  bottomFeatures: [
    { name: 'IRS Precedents',  route: '/precedents',  views: 31, uniqueUsers: 14, trend: 'down',   trendPct: -15 },
    { name: 'Governance Log',  route: '/governance',  views: 28, uniqueUsers: 12, trend: 'stable',  trendPct: 1  },
    { name: 'Admin Metrics',   route: '/admin-metrics', views: 9, uniqueUsers: 4, trend: 'up',     trendPct: 100, isNew: true },
  ],

  totalSessionsInPeriod: 547,

  agentUsage: [
    {
      name: 'Data Aggregation Service',
      key: 'das',
      description: 'Pulls and reconciles data from 6 source systems',
      totalCalls: 521,
      perSessionAvg: 0.95,
      avgConfidenceScore: 0.91,
      successRate: 0.98,
      trend: 'stable',
    },
    {
      name: 'Summarizer Agent',
      key: 'summarizer',
      description: 'Generates AI session brief and client summary',
      totalCalls: 498,
      perSessionAvg: 0.91,
      avgConfidenceScore: 0.88,
      successRate: 0.97,
      trend: 'up',
    },
    {
      name: 'Atlas Assistant',
      key: 'assistant',
      description: 'Live Q&A assistant routed across specialist agents',
      totalCalls: 341,
      perSessionAvg: 0.62,
      avgConfidenceScore: 0.85,
      successRate: 0.94,
      trend: 'up',
    },
    {
      name: 'Policy Evaluation Agent',
      key: 'policy',
      description: 'Evaluates IRS/tax policy compliance and flags risks',
      totalCalls: 312,
      perSessionAvg: 0.57,
      avgConfidenceScore: 0.83,
      successRate: 0.91,
      trend: 'stable',
    },
    {
      name: 'Tax Classifier Agent',
      key: 'tax',
      description: 'Generates optimistic / base / conservative tax scenarios',
      totalCalls: 289,
      perSessionAvg: 0.53,
      avgConfidenceScore: 0.87,
      successRate: 0.95,
      trend: 'up',
    },
    {
      name: 'RAG (Precedent Retrieval)',
      key: 'rag',
      description: 'Retrieves relevant IRS precedents for policy findings',
      totalCalls: 198,
      perSessionAvg: 0.36,
      avgConfidenceScore: 0.79,
      successRate: 0.93,
      trend: 'down',
    },
    {
      name: 'Governance Agent',
      key: 'governance',
      description: 'Risk classification, logging, and expert approval routing',
      totalCalls: 186,
      perSessionAvg: 0.34,
      avgConfidenceScore: 0.90,
      successRate: 0.99,
      trend: 'stable',
    },
    {
      name: 'Self-Healing API Agent',
      key: 'healing',
      description: 'Monitors system health, auto-retries, and cache fallbacks',
      totalCalls: 74,
      perSessionAvg: 0.14,
      avgConfidenceScore: 0.95,
      successRate: 0.97,
      trend: 'up',
    },
  ],

  policyOverrides: {
    HIGH: {
      total: 87,
      approved: 63,
      overridden: 24,
      approvalRateThreshold: 0.75,
      commonOverrides: [
        { actionType: 'Contractor misclassification flag', overrideCount: 8, totalCount: 19, exampleClient: 'Meridian Home Goods' },
        { actionType: 'S-Corp reasonable compensation', overrideCount: 6, totalCount: 21, exampleClient: 'Riviera Salon Group' },
        { actionType: 'Mixed-use real estate deduction', overrideCount: 5, totalCount: 14, exampleClient: 'Coastal Realty Partners' },
        { actionType: 'Home office expense eligibility', overrideCount: 3, totalCount: 18, exampleClient: 'Blue Ridge Bakery' },
        { actionType: 'Passive activity loss carryover', overrideCount: 2, totalCount: 15, exampleClient: 'NextGen Fitness' },
      ],
    },
    MEDIUM: {
      total: 218,
      approved: 197,
      overridden: 21,
      approvalRateThreshold: 0.85,
      commonOverrides: [
        { actionType: 'Section 179 expensing limit', overrideCount: 7, totalCount: 48, exampleClient: 'Apex Landscaping LLC' },
        { actionType: 'Meal & entertainment deduction', overrideCount: 5, totalCount: 52, exampleClient: 'Harbor Light Brewing' },
        { actionType: 'Vehicle use documentation', overrideCount: 4, totalCount: 39, exampleClient: 'TechStart Consulting' },
        { actionType: 'Depreciation schedule election', overrideCount: 3, totalCount: 41, exampleClient: 'Meridian Home Goods' },
        { actionType: 'Health insurance deduction (self-employed)', overrideCount: 2, totalCount: 38, exampleClient: 'Blue Ridge Bakery' },
      ],
    },
    LOW: {
      total: 104,
      approved: 103,
      overridden: 1,
      approvalRateThreshold: 0.95,
      commonOverrides: [
        { actionType: 'Standard mileage rate election', overrideCount: 1, totalCount: 34, exampleClient: 'Coastal Realty Partners' },
      ],
    },
  },

  confidenceTrend: [
    { month: 'Oct 2024', avgConfidence: 0.78, overrideRate: 0.19, totalActions: 312 },
    { month: 'Nov 2024', avgConfidence: 0.80, overrideRate: 0.17, totalActions: 341 },
    { month: 'Dec 2024', avgConfidence: 0.79, overrideRate: 0.18, totalActions: 298 },
    { month: 'Jan 2025', avgConfidence: 0.83, overrideRate: 0.15, totalActions: 378 },
    { month: 'Feb 2025', avgConfidence: 0.85, overrideRate: 0.13, totalActions: 401 },
    { month: 'Mar 2025', avgConfidence: 0.87, overrideRate: 0.11, totalActions: 409 },
  ],
};
