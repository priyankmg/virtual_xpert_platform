'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { platformMetrics } from '@/data/mock/platform-metrics';
import {
  Users, TrendingUp, TrendingDown, BarChart3, Bot, ShieldCheck,
  AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Star, Activity, Minus, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const p = platformMetrics;

// ── Helpers ────────────────────────────────────────────────────────────────────
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function TrendIcon({ trend, trendPct }: { trend: 'up' | 'down' | 'stable'; trendPct: number }) {
  if (trend === 'up')    return <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium"><ArrowUp size={11} />+{trendPct}%</span>;
  if (trend === 'down')  return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><ArrowDown size={11} />{trendPct}%</span>;
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus size={11} />—</span>;
}

function RiskBadge({ risk }: { risk: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const cls = {
    HIGH:   'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW:    'bg-green-100 text-green-700 border-green-200',
  }[risk];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{risk}</span>;
}

// ── Admin Metrics Page ─────────────────────────────────────────────────────────
export default function AdminMetricsPage() {
  const [overrideExpanded, setOverrideExpanded] = useState<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);

  // ── Adoption funnel ──────────────────────────────────────────────────────────
  const funnelActive  = p.funnel.filter(s => !['At Risk / Inactive', 'Churned'].includes(s.label));
  const funnelWarning = p.funnel.filter(s => ['At Risk / Inactive', 'Churned'].includes(s.label));
  const maxCount = funnelActive[0]?.count ?? 1;

  // ── Confidence trend chart data ───────────────────────────────────────────────
  const trendData = p.confidenceTrend.map(t => ({
    month: t.month.replace(' 20', ' \''),
    'Avg Confidence': Math.round(t.avgConfidence * 100),
    'Override Rate':  Math.round(t.overrideRate * 100),
    actions: t.totalActions,
  }));

  // ── Policy override analysis ─────────────────────────────────────────────────
  const riskLevels = ['HIGH', 'MEDIUM', 'LOW'] as const;

  function ApprovalGauge({ risk }: { risk: typeof riskLevels[number] }) {
    const stat = p.policyOverrides[risk];
    const approvalRate = pct(stat.approved, stat.total);
    const thresholdPct = Math.round(stat.approvalRateThreshold * 100);
    const isBelowThreshold = approvalRate < thresholdPct;
    const isExpanded = overrideExpanded === risk;

    const barColor = isBelowThreshold ? '#DE350B' : risk === 'HIGH' ? '#DC2626' : risk === 'MEDIUM' ? '#D97706' : '#16A34A';
    const approveColor = '#16A34A';
    const overrideColor = '#DC2626';

    return (
      <div className={`card overflow-hidden transition-all ${isBelowThreshold ? 'border-red-300 ring-1 ring-red-200' : ''}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RiskBadge risk={risk} />
              {isBelowThreshold && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                  <AlertTriangle size={12} /> Below {thresholdPct}% threshold
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">{stat.total} actions</div>
          </div>

          {/* Segmented bar */}
          <div className="flex h-5 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2">
            <div
              className="flex items-center justify-center transition-all"
              style={{ width: `${pct(stat.approved, stat.total)}%`, background: approveColor }}
              title={`Approved: ${stat.approved}`}
            >
              <span className="text-[10px] font-bold text-white px-1">{stat.approved}</span>
            </div>
            <div
              className="flex items-center justify-center transition-all"
              style={{ width: `${pct(stat.overridden, stat.total)}%`, background: overrideColor }}
              title={`Overridden: ${stat.overridden}`}
            >
              <span className="text-[10px] font-bold text-white px-1">{stat.overridden}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" />{approvalRate}% approved</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />{pct(stat.overridden, stat.total)}% overridden</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: barColor }}>
              <span className="font-semibold">{approvalRate}%</span>
              <span>vs {thresholdPct}% target</span>
            </div>
          </div>

          {/* Click-through for overrides */}
          <button
            onClick={() => setOverrideExpanded(isExpanded ? null : risk)}
            className="mt-3 w-full flex items-center justify-between text-xs font-medium text-[var(--intuit-blue)] hover:text-[#0055A4] transition-colors pt-2 border-t border-[var(--border-color)]"
          >
            <span>View {stat.overridden} most-overridden action types</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-[var(--border-color)] bg-slate-50">
            <div className="px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Most Commonly Overridden — {risk} Risk
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Action Type</th>
                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Overrides</th>
                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Of Total</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Example Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {stat.commonOverrides.map((o, i) => (
                  <tr key={i} className="hover:bg-white transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)] text-xs">{o.actionType}</td>
                    <td className="px-3 py-2.5 text-center text-red-600 font-bold text-sm">{o.overrideCount}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-[var(--text-muted)]">of {o.totalCount}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-muted)] hidden sm:table-cell">{o.exampleClient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Admin Engagement Metrics"
        subtitle={`${p.periodLabel} · as of ${p.asOf}`}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full space-y-8">

        {/* ── Product team banner ── */}
        <div className="rounded-xl px-5 py-4 flex items-start gap-3 border"
          style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 text-sm">This page is for the Atlas Product Team</div>
            <div className="text-xs text-amber-700 mt-0.5">
              User-level engagement metrics, feature adoption data, and AI agent performance signals are shown here.
              Do not share individual expert data without consent. All data is anonymised and aggregated.
            </div>
          </div>
        </div>

        {/* ── Section 1: User Adoption Funnel ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <Users size={16} className="text-[var(--intuit-blue)]" />
            User Adoption Funnel
          </h2>

          {/* Positive funnel steps */}
          <div className="space-y-2 mb-4">
            {funnelActive.map((stage, i) => {
              const barWidth = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: stage.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{stage.label}</span>
                        <span className="ml-2 text-xs text-[var(--text-muted)]">{stage.sublabel}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{stage.count}</span>
                        {stage.pctOfPrev !== null && i > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${stage.pctOfPrev >= 80 ? 'bg-green-100 text-green-700' : stage.pctOfPrev >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {stage.pctOfPrev}% of prev
                          </span>
                        )}
                        {i === 0 && <span className="text-xs text-[var(--text-muted)]">base</span>}
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${barWidth}%`, background: stage.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {funnelWarning.map(stage => (
              <div key={stage.label} className="card p-4 flex items-center gap-3" style={{ borderColor: stage.color + '66' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: stage.color + '20' }}>
                  <AlertTriangle size={16} style={{ color: stage.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{stage.count} users</div>
                  <div className="text-xs font-medium" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{stage.sublabel} · {stage.pctOfTotal}% of base</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary strip */}
          <div className="card p-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--intuit-blue)]">{p.totalInvited}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Total Invited</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{p.funnel[3].count}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Active This Month</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{pct(p.funnel[3].count, p.totalInvited)}%</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Activation Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{p.funnel[5].count + p.funnel[6].count}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">At Risk + Churned</div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Feature Usage ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--intuit-blue)]" />
            Feature Usage — {p.periodLabel}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top 5 */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-color)] bg-green-50 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-800">Top 5 Most Used</span>
              </div>
              <div className="divide-y divide-[var(--border-color)]">
                {p.topFeatures.map((f, i) => {
                  const maxViews = p.topFeatures[0].views;
                  return (
                    <div key={f.name} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <span className="text-xs text-[var(--text-muted)] w-4 text-right shrink-0 font-medium">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{f.name}</span>
                          {f.isNew && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase shrink-0">New</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-[var(--intuit-blue)] opacity-70 transition-all" style={{ width: `${(f.views / maxViews) * 120}px` }} />
                          <span className="text-xs text-[var(--text-muted)]">{f.views} views · {f.uniqueUsers} users</span>
                        </div>
                      </div>
                      <TrendIcon trend={f.trend} trendPct={f.trendPct} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom 3 */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-color)] bg-red-50 flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-sm font-semibold text-red-700">Bottom 3 Least Used</span>
              </div>
              <div className="divide-y divide-[var(--border-color)]">
                {p.bottomFeatures.map((f, i) => (
                  <div key={f.name} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <span className="text-xs text-[var(--text-muted)] w-4 text-right shrink-0 font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{f.name}</span>
                        {f.isNew && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase shrink-0">New</span>}
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{f.views} views · {f.uniqueUsers} unique users</span>
                    </div>
                    <TrendIcon trend={f.trend} trendPct={f.trendPct} />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[var(--border-color)] bg-amber-50">
                <div className="flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>Consider in-app tooltips or onboarding prompts to drive adoption of underused features.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: AI Agent Effectiveness ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Bot size={16} className="text-[var(--intuit-blue)]" />
            AI Agent Effectiveness — {p.totalSessionsInPeriod} sessions
          </h2>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[var(--border-color)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agent</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Calls</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Per Session</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Confidence</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Success</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {p.agentUsage.map(a => {
                    const confColor = a.avgConfidenceScore >= 0.88 ? 'text-green-600' : a.avgConfidenceScore >= 0.80 ? 'text-amber-600' : 'text-red-500';
                    const succColor = a.successRate >= 0.96 ? 'text-green-600' : a.successRate >= 0.90 ? 'text-amber-600' : 'text-red-500';
                    return (
                      <tr key={a.key} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-[var(--text-primary)]">{a.name}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 hidden sm:block">{a.description}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">{a.totalCalls.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{a.perSessionAvg.toFixed(2)}×</td>
                        <td className={`px-4 py-3 text-center font-semibold hidden sm:table-cell ${confColor}`}>
                          {Math.round(a.avgConfidenceScore * 100)}%
                        </td>
                        <td className={`px-4 py-3 text-center font-semibold hidden md:table-cell ${succColor}`}>
                          {Math.round(a.successRate * 100)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.trend === 'up'   && <span className="inline-flex items-center gap-0.5 text-green-600 text-xs"><ArrowUp size={12} />Improving</span>}
                          {a.trend === 'down' && <span className="inline-flex items-center gap-0.5 text-red-500 text-xs"><ArrowDown size={12} />Declining</span>}
                          {a.trend === 'stable' && <span className="text-slate-400 text-xs">Stable</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center gap-5 text-xs text-[var(--text-muted)] bg-slate-50 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Confidence ≥88% — strong</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />80–88% — monitor</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt;80% — needs attention</span>
            </div>
          </div>
        </div>

        {/* ── Section 4: Policy Override Analysis ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--intuit-blue)]" />
            Policy Evaluation — Override Rate by Risk Level
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Thresholds: HIGH ≥75% approval · MEDIUM ≥85% · LOW ≥95%. Below threshold is flagged red.
            Click any row to see the most-overridden action types.
          </p>

          <div className="space-y-4">
            {riskLevels.map(risk => <ApprovalGauge key={risk} risk={risk} />)}
          </div>

          {/* Overall summary */}
          <div className="card p-4 mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[var(--text-primary)]">
                <CheckCircle2 size={18} className="text-green-500" />
                {Object.values(p.policyOverrides).reduce((s, r) => s + r.approved, 0)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Total Approved</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                <XCircle size={18} className="text-red-500" />
                {Object.values(p.policyOverrides).reduce((s, r) => s + r.overridden, 0)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Total Overridden</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {pct(
                  Object.values(p.policyOverrides).reduce((s, r) => s + r.approved, 0),
                  Object.values(p.policyOverrides).reduce((s, r) => s + r.total, 0)
                )}%
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Overall Approval Rate</div>
            </div>
          </div>
        </div>

        {/* ── Section 5: Monthly AI Confidence Trend ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Activity size={16} className="text-[var(--intuit-blue)]" />
            AI Model Confidence & Override Rate — Monthly Trend
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Rising confidence + falling override rate indicates the AI model is improving and expert trust is increasing.
            Divergence between the two lines is a signal for model review.
          </p>

          <div className="card p-5">
            {/* Trend verdict */}
            {(() => {
              const first = p.confidenceTrend[0];
              const last  = p.confidenceTrend[p.confidenceTrend.length - 1];
              const confImproved = last.avgConfidence > first.avgConfidence;
              const overImproved = last.overrideRate < first.overrideRate;
              const improving = confImproved && overImproved;
              return (
                <div className={`mb-4 px-4 py-3 rounded-lg flex items-start gap-2 text-sm ${improving ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  {improving
                    ? <><TrendingUp size={16} className="text-green-600 shrink-0 mt-0.5" /><span className="text-green-800"><strong>Model is improving.</strong> Avg confidence up {Math.round((last.avgConfidence - first.avgConfidence) * 100)}pp and override rate down {Math.round((first.overrideRate - last.overrideRate) * 100)}pp over 6 months.</span></>
                    : <><AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" /><span className="text-amber-800"><strong>Mixed signals.</strong> Review model outputs — confidence and override rate may be diverging.</span></>
                  }
                </div>
              );
            })()}

            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v, name) => [`${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <ReferenceLine y={75} stroke="#DC2626" strokeDasharray="4 3" strokeOpacity={0.4} label={{ value: 'HIGH threshold', fill: '#DC2626', fontSize: 10, position: 'right' }} />
                  <Line
                    type="monotone"
                    dataKey="Avg Confidence"
                    stroke="#0077C5"
                    strokeWidth={2.5}
                    dot={{ fill: '#0077C5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Override Rate"
                    stroke="#DE350B"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ fill: '#DE350B', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Data table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">Month</th>
                    <th className="text-center py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">Actions</th>
                    <th className="text-center py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">Avg Confidence</th>
                    <th className="text-center py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">Override Rate</th>
                    <th className="text-center py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {p.confidenceTrend.map((t, i) => {
                    const prev = p.confidenceTrend[i - 1];
                    const confUp   = prev ? t.avgConfidence > prev.avgConfidence : null;
                    const overDown = prev ? t.overrideRate < prev.overrideRate : null;
                    const status = confUp === null ? null : (confUp && overDown) ? 'better' : (!confUp && !overDown) ? 'worse' : 'mixed';
                    return (
                      <tr key={t.month} className={`hover:bg-slate-50 transition-colors ${i === p.confidenceTrend.length - 1 ? 'bg-[var(--intuit-blue-light)]' : ''}`}>
                        <td className="py-2 font-medium text-[var(--text-primary)]">{t.month}</td>
                        <td className="py-2 text-center text-[var(--text-secondary)]">{t.totalActions}</td>
                        <td className={`py-2 text-center font-semibold ${Math.round(t.avgConfidence * 100) >= 85 ? 'text-green-600' : 'text-amber-600'}`}>
                          {Math.round(t.avgConfidence * 100)}%
                        </td>
                        <td className={`py-2 text-center font-semibold ${Math.round(t.overrideRate * 100) <= 13 ? 'text-green-600' : 'text-amber-600'}`}>
                          {Math.round(t.overrideRate * 100)}%
                        </td>
                        <td className="py-2 text-center">
                          {status === 'better' && <span className="flex items-center justify-center gap-0.5 text-green-600"><Star size={11} className="fill-green-400" />Better</span>}
                          {status === 'worse'  && <span className="flex items-center justify-center gap-0.5 text-red-500"><ArrowDown size={11} />Worse</span>}
                          {status === 'mixed'  && <span className="text-amber-500">Mixed</span>}
                          {status === null     && <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
