'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Loader2, CheckCircle2, AlertTriangle, FileText, TrendingUp, Shield, Search, Calculator, Clock, RefreshCw } from 'lucide-react';

interface PipelineResult {
  summary: {
    executiveSummary: string;
    keyMetrics: { label: string; value: string; trend: string; benchmark: string }[];
    attentionItems: { severity: string; description: string; source: string }[];
    readyForExpertSession: boolean;
  };
  policyReport: {
    overallRiskLevel: string;
    findings: { area: string; finding: string; policyReference: string; riskLevel: string; confidence: number; requiresExpertReview: boolean }[];
    deductionOpportunities: { description: string; estimatedValue: number; confidence: number }[];
  };
  ragResult: {
    precedents: { id: string; title: string; year: number; rulingSummary: string; taxpayerOutcome: string; relevanceScore: number }[];
  };
  taxEstimate: {
    taxYear: number;
    scenarios: {
      conservative: { totalLiability: number; federalTax: number; stateTax: number };
      base: { totalLiability: number; federalTax: number; stateTax: number };
      optimistic: { totalLiability: number; federalTax: number; stateTax: number };
    };
    disclaimer: string;
  };
  totalDurationMs: number;
  completedAt: string;
}

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function SessionBrief() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PipelineResult | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'CLIENT-001' }),
      });
      setData(await res.json());
    } catch { /* no-op */ }
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
        <Header title="Expert Session Brief" subtitle="Sarah Chen · Meridian Home Goods" />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
            <Loader2 size={28} className="text-blue-500 animate-spin" />
          </div>
          <div className="font-semibold text-lg" style={{ color: '#1E293B' }}>Running Full Pipeline…</div>
          <div className="text-sm text-center" style={{ color: '#94A3B8' }}>DAS → Summarizer → Policy → RAG → Tax Classifier</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Expert Session Brief"
        subtitle={`Generated ${new Date(data.completedAt).toLocaleString()} · ${(data.totalDurationMs / 1000).toFixed(1)}s`}
        action={
          <button onClick={run} className="btn-secondary">
            <RefreshCw size={14} />
            Regenerate
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full">

        {/* Status bar */}
        <div className="card p-4 flex items-center gap-3 border-green-200" style={{ background: '#F0FDF4' }}>
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <div>
            <span className="font-semibold text-sm" style={{ color: '#166534' }}>Session Brief Ready</span>
            <span className="text-xs ml-2" style={{ color: '#4ADE80' }}>
              All 6 systems aggregated · Expert review recommended before client delivery
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <FileText size={15} style={{ color: '#0077C5' }} />
            <h2 className="section-title">Executive Summary</h2>
            <span className="agent-badge">Summarizer Agent</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{data.summary.executiveSummary}</p>
        </section>

        {/* Key Metrics */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: '#0077C5' }} />
            <h2 className="section-title">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {data.summary.keyMetrics.map((m, i) => (
              <div key={i} className="metric-card">
                <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>{m.label}</div>
                <div className="text-lg font-bold" style={{ color: '#1E293B' }}>{m.value}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: m.trend === 'UP' ? '#16A34A' : m.trend === 'DOWN' ? '#DC2626' : '#94A3B8' }}>{m.benchmark}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Attention Items */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-500" />
            <h2 className="section-title">Attention Items</h2>
            <span className="badge-high ml-1">{data.summary.attentionItems.filter(i => i.severity === 'HIGH').length} HIGH</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.summary.attentionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <span className={`flex-shrink-0 ${item.severity === 'HIGH' ? 'badge-high' : item.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                  {item.severity}
                </span>
                <div>
                  <p className="text-sm" style={{ color: '#475569' }}>{item.description}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#94A3B8' }}>{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Policy Findings */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Shield size={15} style={{ color: '#0077C5' }} />
            <h2 className="section-title">Policy Findings</h2>
            <span className="agent-badge">Policy Agent</span>
            <span className={`ml-auto flex-shrink-0 ${data.policyReport.overallRiskLevel === 'HIGH' ? 'badge-high' : data.policyReport.overallRiskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
              {data.policyReport.overallRiskLevel} Overall Risk
            </span>
          </div>
          <div className="space-y-3">
            {data.policyReport.findings.filter(f => f.riskLevel !== 'LOW').map((f, i) => (
              <div key={i} className="p-4 rounded-xl border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={f.riskLevel === 'HIGH' ? 'badge-high' : 'badge-medium'}>{f.riskLevel}</span>
                  <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>{f.area}</span>
                  <span className="text-xs ml-auto" style={{ color: '#94A3B8' }}>{(f.confidence * 100).toFixed(0)}% confidence</span>
                  {f.requiresExpertReview && <span className="expert-review-badge">Expert Review</span>}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{f.finding.slice(0, 200)}…</p>
                <p className="text-xs mt-2 font-medium" style={{ color: '#94A3B8' }}>{f.policyReference}</p>
              </div>
            ))}
          </div>
        </section>

        {/* IRS Precedents */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Search size={15} style={{ color: '#0077C5' }} />
            <h2 className="section-title">Top IRS Precedents</h2>
            <span className="agent-badge">RAG Agent</span>
          </div>
          <div className="space-y-3">
            {data.ragResult.precedents.slice(0, 3).map((p, i) => (
              <div key={i} className="p-4 rounded-xl border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>{p.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">{p.year}</span>
                  <span className="text-xs ml-auto font-semibold" style={{ color: '#0077C5' }}>Relevance: {(p.relevanceScore * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{p.rulingSummary}</p>
                <span className={`mt-2 inline-block text-xs font-semibold ${(p.taxpayerOutcome ?? '').startsWith('WON') ? 'text-green-600' : 'text-red-600'}`}>
                  {p.taxpayerOutcome}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tax Estimate */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Calculator size={15} style={{ color: '#0077C5' }} />
            <h2 className="section-title">Tax Estimate — 3 Scenarios</h2>
            <span className="agent-badge">Tax Classifier</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {(['conservative', 'base', 'optimistic'] as const).map(scenario => {
              const s = data.taxEstimate.scenarios[scenario];
              const isBase = scenario === 'base';
              return (
                <div key={scenario} className={`p-4 rounded-xl border ${isBase ? 'border-blue-200' : 'border-slate-200'}`}
                  style={{ background: isBase ? '#EFF6FF' : '#F8FAFC' }}>
                  {isBase && <div className="text-xs font-semibold mb-1" style={{ color: '#0077C5' }}>Recommended</div>}
                  <div className="text-xs font-medium mb-2 capitalize" style={{ color: '#94A3B8' }}>{scenario} scenario</div>
                  <div className="text-2xl font-bold mb-3" style={{ color: '#1E293B' }}>{fmt(s.totalLiability)}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span style={{ color: '#94A3B8' }}>Federal</span><span className="font-mono font-medium" style={{ color: '#475569' }}>{fmt(s.federalTax)}</span></div>
                    <div className="flex justify-between text-xs"><span style={{ color: '#94A3B8' }}>California</span><span className="font-mono font-medium" style={{ color: '#475569' }}>{fmt(s.stateTax)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="disclaimer-banner">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{data.taxEstimate.disclaimer}</span>
          </div>
        </section>

        {/* Expert Review Panel */}
        <section className="card p-5 sm:p-6 border-orange-200" style={{ background: '#FFF7ED' }}>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Clock size={15} className="text-orange-500" />
            <h2 className="section-title" style={{ color: '#9A3D00' }}>Expert Review Required</h2>
            <span className="badge-action ml-1">ACTION Items</span>
          </div>
          <div className="divide-y divide-orange-100">
            {data.policyReport.findings.filter(f => f.requiresExpertReview).map((f, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: '#92400E' }}>{f.area}</span>
                  <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>{f.policyReference}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="btn-primary text-xs px-3 py-1.5">Approve</button>
                  <button className="btn-secondary text-xs px-3 py-1.5">Defer</button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
