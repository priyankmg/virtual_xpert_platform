'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Shield, AlertTriangle, DollarSign, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface PolicyReport {
  evaluationDate: string;
  overallRiskLevel: string;
  findings: { area: string; finding: string; policyReference: string; riskLevel: string; confidence: number; requiresExpertReview: boolean }[];
  deductionOpportunities: { description: string; estimatedValue: number; confidence: number; policyReference: string }[];
  complianceGaps: { description: string; deadline: string; severity: string }[];
  expertReviewRequired: boolean;
}

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function PolicyReview() {
  const [data, setData] = useState<PolicyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const snapRes = await fetch('/api/das/snapshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'CLIENT-001' }),
      });
      const snap = await snapRes.json();
      const policyRes = await fetch('/api/agents/policy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snap }),
      });
      setData(await policyRes.json());
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
        <Header title="Policy Review" subtitle="IRS Compliance Evaluation" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  const highFindings = data.findings.filter(f => f.riskLevel === 'HIGH');
  const medFindings = data.findings.filter(f => f.riskLevel === 'MEDIUM');
  const lowFindings = data.findings.filter(f => f.riskLevel === 'LOW');
  const totalDeductions = data.deductionOpportunities.reduce((s, d) => s + d.estimatedValue, 0);

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header title="Policy Review" subtitle={`Evaluated ${new Date(data.evaluationDate).toLocaleDateString()} · 7 policy areas`} />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full">

        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>Overall Risk</div>
            <div className={`text-xl font-bold ${data.overallRiskLevel === 'HIGH' ? 'text-red-600' : data.overallRiskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'}`}>
              {data.overallRiskLevel}
            </div>
          </div>
          <div className="metric-card">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>HIGH Risk</div>
            <div className="text-xl font-bold text-red-600">{highFindings.length}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>Deductions Found</div>
            <div className="text-xl font-bold text-green-600">{fmt(totalDeductions)}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>Deadlines</div>
            <div className="text-xl font-bold text-amber-600">{data.complianceGaps.length}</div>
          </div>
        </div>

        {/* Findings by severity */}
        {[
          { label: 'HIGH Risk Findings', items: highFindings, colorClass: 'text-red-600' },
          { label: 'MEDIUM Risk Findings', items: medFindings, colorClass: 'text-amber-600' },
          { label: 'LOW Risk Findings', items: lowFindings, colorClass: 'text-green-600' },
        ].filter(g => g.items.length > 0).map(group => (
          <section key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} className={group.colorClass} />
              <h2 className="text-sm font-semibold" style={{ color: '#1E293B' }}>{group.label}</h2>
              <span className={`${group.colorClass.includes('red') ? 'badge-high' : group.colorClass.includes('amber') ? 'badge-medium' : 'badge-low'}`}>
                {group.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map((f) => {
                const globalIdx = data.findings.indexOf(f);
                const expanded = expandedFinding === globalIdx;
                return (
                  <div key={globalIdx} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedFinding(expanded ? null : globalIdx)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className={f.riskLevel === 'HIGH' ? 'badge-high' : f.riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                          {f.riskLevel}
                        </span>
                        <span className="text-sm font-semibold truncate" style={{ color: '#1E293B' }}>{f.area}</span>
                        {f.requiresExpertReview && <span className="expert-review-badge hidden sm:inline-flex">Expert Review</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs hidden sm:inline" style={{ color: '#94A3B8' }}>{(f.confidence * 100).toFixed(0)}%</span>
                        {expanded ? <ChevronUp size={14} style={{ color: '#94A3B8' }} /> : <ChevronDown size={14} style={{ color: '#94A3B8' }} />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50">
                        <div className="pt-3 space-y-3">
                          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{f.finding}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-white border border-slate-200" style={{ color: '#64748B' }}>
                              {f.policyReference}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="confidence-bar w-24"><div className="confidence-fill" style={{ width: `${f.confidence * 100}%` }} /></div>
                              <span className="text-xs" style={{ color: '#94A3B8' }}>{(f.confidence * 100).toFixed(0)}% confidence</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Deduction Opportunities */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} className="text-green-600" />
            <h2 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Deduction Opportunities</h2>
            <span className="badge-low">{fmt(totalDeductions)} potential</span>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Est. Value</th>
                    <th className="hidden sm:table-cell">Policy Reference</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deductionOpportunities.map((d, i) => (
                    <tr key={i}>
                      <td style={{ color: '#1E293B' }}>{d.description}</td>
                      <td className="font-mono font-semibold text-green-600">{fmt(d.estimatedValue)}</td>
                      <td className="hidden sm:table-cell text-xs" style={{ color: '#94A3B8' }}>{d.policyReference}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="confidence-bar w-12 sm:w-20"><div className="confidence-fill" style={{ width: `${d.confidence * 100}%` }} /></div>
                          <span className="text-xs" style={{ color: '#94A3B8' }}>{(d.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Compliance Deadlines */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Compliance Deadlines</h2>
          </div>
          <div className="space-y-2">
            {data.complianceGaps.map((g, i) => (
              <div key={i} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-start sm:items-center gap-3">
                  <span className={g.severity === 'HIGH' ? 'badge-high' : g.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                    {g.severity}
                  </span>
                  <span className="text-sm" style={{ color: '#475569' }}>{g.description}</span>
                </div>
                <span className="text-sm font-semibold font-mono flex-shrink-0 text-amber-600">
                  {new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
