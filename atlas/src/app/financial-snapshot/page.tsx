'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { RefreshCw, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { quickbooksData } from '@/data/mock/quickbooks';
import { adpPayrollData } from '@/data/mock/adp-payroll';
import { expensifyData } from '@/data/mock/expensify';
import { stripeData } from '@/data/mock/stripe';
import { inventoryData } from '@/data/mock/inventory';

type Tab = 'overview' | 'accounting' | 'payroll' | 'expenses' | 'revenue' | 'inventory';

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function FinancialSnapshot() {
  const [tab, setTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = async () => {
    setRefreshing(true);
    await fetch('/api/das/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'CLIENT-001' }),
    });
    await new Promise(r => setTimeout(r, 600));
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'inventory', label: 'Inventory' },
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Financial Snapshot"
        subtitle={`Refreshed ${lastRefresh.toLocaleTimeString()}`}
        action={
          <button onClick={refresh} disabled={refreshing} className="btn-secondary">
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5">

        {/* Flags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-500" />
              <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Reconciliation Flags</span>
              <span className="badge-medium ml-1">2</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-100">
                <span style={{ color: '#475569' }}>Net Revenue · Stripe vs. QuickBooks</span>
                <span className="badge-medium">Δ {fmt(148_000)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span style={{ color: '#475569' }}>COGS · Inventory vs. QuickBooks</span>
                <span className="badge-high">Δ {fmt(560_000)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={15} className="text-red-500" />
              <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Data Gaps</span>
              <span className="badge-high ml-1">3</span>
            </div>
            <div className="space-y-1.5">
              {[
                'Q4 payroll tax deposits not confirmed for December',
                'December P&L incomplete — month not closed',
                'Depreciation schedule for 2025 additions not uploaded',
              ].map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                  {gap}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 p-1 rounded-xl w-fit min-w-full sm:min-w-0" style={{ background: '#F1F5F9' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {tab === 'overview' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', value: fmt(12_400_000), sub: 'QuickBooks YTD' },
                { label: 'Net Income', value: fmt(1_870_000), sub: '15.1% margin' },
                { label: 'Total Payroll', value: fmt(3_200_000), sub: '85 employees' },
                { label: 'Total Assets', value: fmt(4_250_000), sub: 'Balance sheet' },
                { label: 'Total Liabilities', value: fmt(1_380_000), sub: 'Balance sheet' },
                { label: 'Approved Expenses', value: fmt(284_000), sub: `${fmt(42_000)} flagged` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="metric-card">
                  <div className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>{label}</div>
                  <div className="text-xl font-bold" style={{ color: '#1E293B' }}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{sub}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'accounting' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Chart of Accounts — QuickBooks Online</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Category</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickbooksData.chartOfAccounts.map((acct, i) => (
                      <tr key={i}>
                        <td className="font-medium" style={{ color: '#1E293B' }}>{acct.account}</td>
                        <td>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            acct.category === 'Revenue' ? 'bg-green-50 text-green-700' :
                            acct.category === 'COGS' ? 'bg-orange-50 text-orange-700' :
                            acct.category === 'Asset' ? 'bg-blue-50 text-blue-700' :
                            acct.category === 'Liability' ? 'bg-red-50 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{acct.category}</span>
                        </td>
                        <td className="text-right font-mono font-semibold" style={{ color: '#1E293B' }}>{fmt(acct.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'payroll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Wages', value: fmt(adpPayrollData.totalWages) },
                  { label: 'Employer Taxes', value: fmt(adpPayrollData.employerTaxes) },
                  { label: 'Benefits', value: fmt(adpPayrollData.benefitsDeductions) },
                  { label: 'Contractor Payments', value: fmt(adpPayrollData.contractorPayments) },
                ].map(({ label, value }) => (
                  <div key={label} className="metric-card">
                    <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>{label}</div>
                    <div className="text-lg font-bold" style={{ color: '#1E293B' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Payroll Register</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>YTD Wages</th>
                        <th>Withholding</th>
                        <th>Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adpPayrollData.employees.map(emp => (
                        <tr key={emp.id}>
                          <td className="font-medium" style={{ color: '#1E293B' }}>{emp.name}</td>
                          <td>{emp.isContractor ? <span className="badge-action">1099</span> : <span className="badge-read">W-2</span>}</td>
                          <td className="font-mono">{fmt(emp.ytdWages)}</td>
                          <td className="font-mono">{emp.isContractor ? '—' : fmt(emp.ytdWithholding)}</td>
                          <td className="font-mono">{emp.isContractor ? '—' : fmt(emp.benefits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'expenses' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Expense Categories — Expensify</span>
                <div className="flex gap-3 text-xs font-medium flex-wrap">
                  <span style={{ color: '#64748B' }}>Total: {fmt(expensifyData.total)}</span>
                  <span className="text-green-600">Deductible: {fmt(expensifyData.deductible)}</span>
                  <span className="text-red-500">Flagged: {fmt(expensifyData.flagged)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Deductible %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensifyData.byCategory.map((cat, i) => (
                      <tr key={i}>
                        <td style={{ color: '#1E293B' }}>{cat.category}</td>
                        <td className="font-mono font-medium">{fmt(cat.amount)}</td>
                        <td>{cat.deductiblePercent}%</td>
                        <td>{cat.flagged ? <span className="badge-high"><AlertTriangle size={10} />Flagged</span> : <span className="badge-low">Approved</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'revenue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Stripe Gross Revenue', value: fmt(stripeData.stripe.gross) },
                  { label: 'Refunds & Chargebacks', value: fmt(stripeData.stripe.refunds) },
                  { label: 'Processing Fees (Deductible)', value: fmt(stripeData.stripe.fees) },
                ].map(({ label, value }) => (
                  <div key={label} className="metric-card">
                    <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>{label}</div>
                    <div className="text-xl font-bold" style={{ color: '#1E293B' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Monthly Gross Revenue — Stripe</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Month</th><th>Gross Revenue</th><th>vs. QuickBooks</th></tr>
                    </thead>
                    <tbody>
                      {stripeData.monthlyGross.map((row, i) => {
                        const qbRow = quickbooksData.monthlyRevenue[i];
                        const delta = row.amount - (qbRow?.amount ?? 0);
                        return (
                          <tr key={i}>
                            <td style={{ color: '#1E293B' }}>{row.month}</td>
                            <td className="font-mono">{fmt(row.amount)}</td>
                            <td>{Math.abs(delta) > 100 ? <span className={delta > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>{delta > 0 ? '+' : ''}{fmt(delta)}</span> : <span style={{ color: '#94A3B8' }}>—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                {[
                  { label: 'Beginning Inventory Value', value: fmt(inventoryData.beginningValue) },
                  { label: 'Ending Inventory Value (Q3)', value: fmt(inventoryData.endingValue) },
                  { label: 'Cost of Goods Sold', value: fmt(inventoryData.cogs) },
                  { label: 'Inventory Write-Downs', value: fmt(inventoryData.writeDowns) },
                  { label: 'Shrinkage Reserve', value: fmt(inventoryData.shrinkageReserve) },
                  { label: 'Obsolescence Reserve', value: fmt(inventoryData.obsolescenceReserve) },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-4 flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#475569' }}>{label}</span>
                    <span className="font-mono font-semibold" style={{ color: '#1E293B' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="card p-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>Inventory Notes</h4>
                <div className="space-y-3 text-sm" style={{ color: '#475569' }}>
                  <p>Write-downs of {fmt(inventoryData.writeDowns)} require contemporaneous FMV documentation.</p>
                  <p>Valuation method: Lower of Cost or Market (LIFO), consistent for 3 years.</p>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">COGS reconciliation gap vs. QuickBooks: {fmt(7_380_000 - inventoryData.cogs)}. Investigate before filing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
