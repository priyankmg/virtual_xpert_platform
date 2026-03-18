export interface AccountingData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  monthlyRevenue: { month: string; amount: number }[];
  chartOfAccounts: { account: string; balance: number; category: string }[];
}

export interface PayrollData {
  totalWages: number;
  employerTaxes: number;
  benefitsDeductions: number;
  contractorPayments: number;
  filingStatus: {
    form941: 'FILED' | 'PENDING' | 'OVERDUE';
    form940: 'FILED' | 'PENDING' | 'OVERDUE';
  };
  employees: {
    id: string;
    name: string;
    ytdWages: number;
    ytdWithholding: number;
    benefits: number;
    isContractor: boolean;
  }[];
}

export interface ExpensesData {
  total: number;
  deductible: number;
  flagged: number;
  byCategory: {
    category: string;
    amount: number;
    deductiblePercent: number;
    flagged: boolean;
  }[];
}

export interface RevenueData {
  stripe: {
    gross: number;
    refunds: number;
    fees: number;
  };
  recognized: number;
  deferred: number;
  monthlyGross: { month: string; amount: number }[];
  threshold1099K: boolean;
}

export interface InventoryData {
  beginningValue: number;
  endingValue: number;
  cogs: number;
  writeDowns: number;
  shrinkageReserve: number;
  obsolescenceReserve: number;
}

export interface TaxHistoryData {
  priorYearReturns: {
    year: number;
    form: string;
    federalTaxableIncome: number;
    federalTax: number;
    stateTax: number;
    effectiveTaxRate: number;
  }[];
  effectiveTaxRates: { year: number; rate: number }[];
  carryforwards: {
    type: string;
    amount: number;
    expirationYear: number | null;
  }[];
}

export interface ReconciliationFlag {
  field: string;
  system1: string;
  system1Value: number;
  system2: string;
  system2Value: number;
  delta: number;
}

export interface ClientFinancialSnapshot {
  clientId: string;
  clientName: string;
  snapshotDate: string;
  accounting: AccountingData;
  payroll: PayrollData;
  expenses: ExpensesData;
  revenue: RevenueData;
  inventory: InventoryData;
  taxHistory: TaxHistoryData;
  dataGaps: string[];
  reconciliationFlags: ReconciliationFlag[];
}
