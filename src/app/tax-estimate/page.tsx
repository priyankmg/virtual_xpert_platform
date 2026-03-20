'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import ClientBanner from '@/components/ui/ClientBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TaxScenario {
  federalTaxableIncome: number;
  federalTax: number;
  stateTax: number;
  totalLiability: number;
  keyAssumptions: string[];
}

interface TaxEstimate {
  taxYear: number;
  scenarios: { conservative: TaxScenario; base: TaxScenario; optimistic: TaxScenario };
  quarterlyPaymentsRequired: { q1: number; q2: number; q3: number; q4: number };
  priorYearComparison: { priorLiability: number; change: number; changePercent: number };
  disclaimer: string;
  confidenceScore: number;
}

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function TaxEstimate() {
  const [data, setData] = useState<TaxEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snapRes = await fetch('/api/das/snapshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'CLIENT-001' }),
      });
      const snap = await snapRes.json();
      const res = await fetch('/api/agents/tax-classifier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snap }),
      });
      setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
        <Header title="Tax Estimate" subtitle="2025 Federal & State Tax Liability" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  const isUp = data.priorYearComparison.change > 0;

  const chartData = [
    { name: 'Prior Year', total: data.priorYearComparison.priorLiability, federal: 345060, state: 129600 },
    { name: 'Conservative', total: data.scenarios.conservative.totalLiability, federal: data.scenarios.conservative.federalTax, state: data.scenarios.conservative.stateTax },
    { name: 'Base', total: data.scenarios.base.totalLiability, federal: data.scenarios.base.federalTax, state: data.scenarios.base.stateTax },
    { name: 'Optimistic', total: data.scenarios.optimistic.totalLiability, federal: data.scenarios.optimistic.federalTax, state: data.scenarios.optimistic.stateTax },
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Tax Estimate"
        subtitle={`Tax Year ${data.taxYear} · S-Corp · California · ${(data.confidenceScore * 100).toFixed(0)}% confidence`}
      />
      <ClientBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full">

        {/* Disclaimer */}
        <div className="disclaimer-banner">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{data.disclaimer}</span>
        </div>

        {/* 3 scenarios — responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([['conservative', 'Worst Case'], ['base', 'Base Case'], ['optimistic', 'Best Case']] as const).map(([key, label]) => {
            const s = data.scenarios[key];
            const isBase = key === 'base';
            return (
              <div key={key}
                className={`card p-5 ${isBase ? 'border-blue-300 shadow-md' : ''}`}
                style={isBase ? { background: '#EFF6FF' } : {}}
              >
                {isBase && (
                  <div className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: '#0077C5' }}>Recommended</div>
                )}
                <div className="text-xs font-medium mb-2 text-slate-400">{label}</div>
                <div className="text-3xl font-bold mb-4" style={{ color: '#1E293B' }}>{fmt(s.totalLiability)}</div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#94A3B8' }}>Federal Taxable Inc.</span>
                    <span className="font-mono font-medium" style={{ color: '#475569' }}>{fmt(s.federalTaxableIncome)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#94A3B8' }}>Federal Tax</span>
                    <span className="font-mono font-medium" style={{ color: '#475569' }}>{fmt(s.federalTax)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                    <span style={{ color: '#94A3B8' }}>California State Tax</span>
                    <span className="font-mono font-medium" style={{ color: '#475569' }}>{fmt(s.stateTax)}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-1">
                  <div className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>Key Assumptions</div>
                  {s.keyAssumptions.map((a, i) => (
                    <div key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#64748B' }}>
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prior year comparison */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUp ? 'bg-red-50' : 'bg-green-50'}`}>
            {isUp ? <TrendingUp size={18} className="text-red-500" /> : <TrendingDown size={18} className="text-green-500" />}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#1E293B' }}>Prior Year Comparison (2024)</div>
            <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
              Prior year total: {fmt(data.priorYearComparison.priorLiability)} ·{' '}
              Change:{' '}
              <span className={`font-semibold ${isUp ? 'text-red-600' : 'text-green-600'}`}>
                {isUp ? '+' : ''}{fmt(data.priorYearComparison.change)} ({isUp ? '+' : ''}{data.priorYearComparison.changePercent.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>Scenario Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip
                formatter={(v) => fmt(Number(v))}
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#1E293B', fontWeight: 600 }}
                itemStyle={{ color: '#475569' }}
              />
              <Legend wrapperStyle={{ color: '#64748B', fontSize: 12 }} />
              <Bar dataKey="federal" name="Federal Tax" fill="#0077C5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="state" name="California Tax" fill="#FF6900" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quarterly schedule */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>Quarterly Payment Schedule (Base Scenario)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <div key={q} className="p-4 rounded-xl text-center border border-slate-100" style={{ background: '#F8FAFC' }}>
                <div className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: '#94A3B8' }}>{q}</div>
                <div className="text-lg font-bold" style={{ color: '#1E293B' }}>{fmt(data.quarterlyPaymentsRequired[q])}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: '#94A3B8' }}>
                  {q === 'q1' ? 'Apr 15' : q === 'q2' ? 'Jun 15' : q === 'q3' ? 'Sep 15' : 'Jan 15'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
