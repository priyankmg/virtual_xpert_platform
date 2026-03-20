import { ClientFinancialSnapshot } from '../data/types/snapshot';
import { quickbooksData } from '../data/mock/quickbooks';
import { adpPayrollData } from '../data/mock/adp-payroll';
import { expensifyData } from '../data/mock/expensify';
import { stripeData } from '../data/mock/stripe';
import { inventoryData } from '../data/mock/inventory';
import { priorTaxReturnsData } from '../data/mock/prior-tax-returns';
import { logAgentAction } from '../services/governance-store';

const snapshotCache = new Map<string, ClientFinancialSnapshot>();

const clients = [
  { id: 'CLIENT-001', name: 'Sarah Chen — Meridian Home Goods' },
  { id: 'CLIENT-002', name: 'David Torres — Pinnacle Landscaping' },
  { id: 'CLIENT-003', name: 'Rachel Kim — Bloom Wellness Studios' },
];

export async function generateSnapshot(
  clientId: string,
  snapshotDate?: string
): Promise<ClientFinancialSnapshot> {
  const client = clients.find(c => c.id === clientId) ?? clients[0];
  const date = snapshotDate ?? new Date().toISOString().split('T')[0];

  // Simulate parallel data fetch
  await new Promise(r => setTimeout(r, 150));

  // Revenue discrepancy between Stripe and QuickBooks
  const stripeRevenue = stripeData.stripe.gross - stripeData.stripe.refunds;
  const qbRevenue = quickbooksData.revenue;
  const reconciliationFlags = [];

  if (Math.abs(stripeRevenue - qbRevenue) > 1000) {
    reconciliationFlags.push({
      field: 'Net Revenue',
      system1: 'Stripe',
      system1Value: stripeRevenue,
      system2: 'QuickBooks',
      system2Value: qbRevenue,
      delta: stripeRevenue - qbRevenue,
    });
  }

  // COGS discrepancy between QBO and Inventory
  const invCogs = inventoryData.beginningValue + 7_500_000 - inventoryData.endingValue;
  if (Math.abs(invCogs - quickbooksData.cogs) > 1000) {
    reconciliationFlags.push({
      field: 'COGS',
      system1: 'Inventory System',
      system1Value: invCogs,
      system2: 'QuickBooks',
      system2Value: quickbooksData.cogs,
      delta: invCogs - quickbooksData.cogs,
    });
  }

  const snapshot: ClientFinancialSnapshot = {
    clientId: client.id,
    clientName: client.name,
    snapshotDate: date,
    accounting: quickbooksData,
    payroll: adpPayrollData,
    expenses: expensifyData,
    revenue: stripeData,
    inventory: inventoryData,
    taxHistory: priorTaxReturnsData,
    dataGaps: [
      'Q4 payroll tax deposits not yet confirmed for December',
      'December P&L is incomplete — month not closed',
      'Depreciation schedule for 2025 asset additions not uploaded',
    ],
    reconciliationFlags,
  };

  snapshotCache.set(clientId, snapshot);

  logAgentAction({
    agentName: 'Data Aggregation Service',
    actionType: 'READ',
    clientId,
    inputSummary: `Snapshot requested for ${client.name} as of ${date}`,
    outputSummary: `Aggregated 6 source systems. ${reconciliationFlags.length} reconciliation flag(s). ${snapshot.dataGaps.length} data gap(s).`,
    confidenceScore: 0.97,
    expertReviewRequired: false,
  });

  return snapshot;
}

export function getCachedSnapshot(clientId: string): ClientFinancialSnapshot | null {
  return snapshotCache.get(clientId) ?? null;
}

export function getAvailableClients() {
  return clients;
}
