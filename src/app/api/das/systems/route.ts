import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    systems: [
      { id: 'quickbooks', name: 'QuickBooks Online', status: 'CONNECTED', lastSync: new Date().toISOString() },
      { id: 'adp', name: 'ADP Payroll', status: 'CONNECTED', lastSync: new Date().toISOString() },
      { id: 'expensify', name: 'Expensify', status: 'CONNECTED', lastSync: new Date().toISOString() },
      { id: 'stripe', name: 'Stripe', status: 'CONNECTED', lastSync: new Date().toISOString() },
      { id: 'inventory', name: 'Inventory System', status: 'CONNECTED', lastSync: new Date().toISOString() },
      { id: 'tax-returns', name: 'Prior Year Tax Returns', status: 'CONNECTED', lastSync: new Date().toISOString() },
    ],
  });
}
