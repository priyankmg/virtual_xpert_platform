'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { platformMetrics } from '@/data/mock/platform-metrics';
import {
  Users, TrendingUp, TrendingDown, BarChart3, Bot, ShieldCheck,
  AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Star, Activity, Minus, ArrowUp, ArrowDown, Timer, Target,
  Percent, Sparkles, Layers, HelpCircle, ClipboardList,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
  BarChart, Bar,
} from 'recharts';

const p = platformMetrics;

// ── Helpers ────────────────────────────────────────────────────────────────────
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function TrendIcon({ trend, trendPct }: { trend: 'up' | 'down' | 'stable'; trendPct: number }) {
  if (trend === 'up')    return <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium"><ArrowUp size={11} />+{trendPct}%</span>;
  if (trend === 'down')  return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><ArrowDown size={11} />{trendPct}%</span>;
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus size={11} />—</span>;
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle ml-1">
      <button
        type="button"
        className="rounded-full p-0.5 text-[var(--text-muted)] hover:text-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
        aria-label="More information"
      >
        <HelpCircle size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 max-w-[85vw] p-3 rounded-xl text-xs text-left font-normal leading-relaxed text-white shadow-xl"
        style={{ background: '#1E293B', border: '1px solid #334155' }}
      >
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full border-8 border-transparent" style={{ borderTopColor: '#1E293B' }} />
      </span>
    </span>
  );
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
            className="mt-3 w-full flex items-center justify-between text-xs font-medium text-[var(--brand-blue)] hover:text-[#0055A4] transition-colors pt-2 border-t border-[var(--border-color)]"
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

        {/* ── Section 1: Expert Adoption Funnel ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Users size={16} className="text-[var(--brand-blue)]" />
            Expert Adoption Funnel
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-5 max-w-3xl">
            Tracks how invited experts move through activation and ongoing usage. At-risk and churned counts include{' '}
            <strong className="text-[var(--text-secondary)]">{p.funnel[5].count}</strong> at-risk and{' '}
            <strong className="text-[var(--text-secondary)]">{p.funnel[6].count}</strong> churned experts in this period.
          </p>

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
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{stage.count} experts</div>
                  <div className="text-xs font-medium" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{stage.sublabel} · {stage.pctOfTotal}% of base</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary strip — 6 cards (spec) */}
          <div className="card p-4 mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--brand-blue)]">{p.totalInvited}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Total experts invited</div>
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
              <div className="text-2xl font-bold text-[#00875A]">{Math.round(p.funnelSummary.sessionCompletionRate * 100)}%</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Session Completion Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--brand-blue)]">{Math.round(p.funnelSummary.firstSessionResolutionRate * 100)}%</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">First Session Resolution Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <Timer size={18} className="text-[var(--text-muted)] opacity-80" />
                {p.funnelSummary.avgSessionPrepMinutes}
                <span className="text-sm font-semibold text-[var(--text-muted)]">min</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Avg Session Prep Time</div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Feature Usage ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--brand-blue)]" />
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
                          <div className="h-1.5 rounded-full bg-[var(--brand-blue)] opacity-70 transition-all" style={{ width: `${(f.views / maxViews) * 120}px` }} />
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

        {/* ── Conversion Metrics ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Percent size={16} className="text-[var(--brand-blue)]" />
            Conversion Metrics
          </h2>

          <div className="card p-5 mb-4 border-l-4" style={{ borderLeftColor: '#0077C5' }}>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">{p.conversion.sessionsScheduled.toLocaleString()} sessions</strong> were scheduled in this period.
              Of those, <strong className="text-[var(--brand-blue)]">{p.conversion.sessionsWithPrep.toLocaleString()}</strong> had a{' '}
              <strong>session prep</strong> (AI pipeline / brief generation) invoked, and{' '}
              <strong className="text-[#00875A]">{p.conversion.sessionsCompleted.toLocaleString()}</strong> were successfully{' '}
              <strong>held and completed</strong>.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
              <span>
                Prep coverage:{' '}
                <strong className="text-[var(--text-primary)]">{pct(p.conversion.sessionsWithPrep, p.conversion.sessionsScheduled)}%</strong> of scheduled sessions
              </span>
              <span>
                Completion:{' '}
                <strong className="text-[var(--text-primary)]">{pct(p.conversion.sessionsCompleted, p.conversion.sessionsScheduled)}%</strong> of scheduled sessions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center border-t-4" style={{ borderTopColor: '#0077C5' }}>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Session completion rate</div>
              <div className="text-3xl font-bold text-[var(--brand-blue)]">{Math.round(p.conversion.sessionCompletionRate * 100)}%</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Share of scheduled sessions that completed</div>
            </div>
            <div className="card p-5 text-center border-t-4" style={{ borderTopColor: '#00875A' }}>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">First session resolution rate</div>
              <div className="text-3xl font-bold text-[#00875A]">{Math.round(p.conversion.firstSessionResolutionRate * 100)}%</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">No follow-up ticket within 7 days</div>
            </div>
            <div className="card p-5 text-center border-t-4 relative" style={{ borderTopColor: '#FF6900' }}>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 flex items-center justify-center gap-0.5">
                Expert readiness score
                <HelpTip text={p.conversion.expertReadinessScoreExplanation} />
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)]">{p.conversion.expertReadinessScore}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">0–100 · Target 80%</div>
            </div>
          </div>
        </div>

        {/* ── Session prep metrics ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-[var(--brand-blue)]" />
            Session prep (AI brief pipeline)
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4 max-w-3xl">
            Usage of the pre-session data aggregation and brief generation flow — who ran prep, how long it took, and whether it led to a completed session.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Sessions with prep invoked</div>
              <div className="text-2xl font-bold text-[var(--brand-blue)]">{p.sessionPrepMetrics.sessionsWithPrepInvoked.toLocaleString()}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Prep pipeline run at least once</div>
            </div>
            <div className="card p-5">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Average prep time</div>
              <div className="text-2xl font-bold text-[var(--text-primary)] flex items-baseline gap-1">
                {p.sessionPrepMetrics.avgPrepTimeMinutes}
                <span className="text-sm font-semibold text-[var(--text-muted)]">min</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Wall-clock, pipeline + review</div>
            </div>
            <div className="card p-5">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Preps → completed sessions</div>
              <div className="text-2xl font-bold text-[#00875A]">{p.sessionPrepMetrics.prepsLeadingToCompletedSessions.toLocaleString()}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Prep followed by a held &amp; completed session</div>
            </div>
            <div className="card p-5 sm:col-span-2 lg:col-span-1">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">New experts (≤90 days) who ran prep</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{p.sessionPrepMetrics.newExpertsInvokedPrep}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">First-time cohort using session prep</div>
            </div>
            <div className="card p-5 sm:col-span-2">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Existing experts who ran prep</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{p.sessionPrepMetrics.existingExpertsUsedPrep}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Tenured experts invoking prep this period</div>
            </div>
          </div>
        </div>

        {/* ── Atlas Impact — cohort comparison (spec) ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Target size={16} className="text-[var(--brand-blue)]" />
            Atlas Impact — Cohort Comparison
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Matched cohorts: experts with <strong className="text-[var(--text-secondary)]">≥90 days</strong> on platform · control = historical pre-Atlas baseline where noted.
          </p>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-[var(--border-color)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Metric</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0077C5' }}>With Atlas</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Without Atlas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {p.atlasImpactCohort.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{row.metric}</td>
                      <td className="px-4 py-3 text-center font-semibold" style={{ color: '#0077C5' }}>{row.withAtlas}</td>
                      <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{row.withoutAtlas}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] hidden md:table-cell">{row.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Section 3: AI Agent Effectiveness ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Bot size={16} className="text-[var(--brand-blue)]" />
            AI Agent Effectiveness — {p.totalSessionsInPeriod} sessions
          </h2>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[var(--border-color)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agent</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Calls</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Per Session</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">p50 Latency</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">p95 Latency</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Confidence</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Success</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Trend</th>
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
                        <td className="px-3 py-3 text-center font-semibold text-[var(--text-primary)]">{a.totalCalls.toLocaleString()}</td>
                        <td className="px-3 py-3 text-center text-[var(--text-secondary)]">{a.perSessionAvg.toFixed(2)}×</td>
                        <td className="px-3 py-3 text-center text-[var(--text-secondary)] tabular-nums hidden lg:table-cell">{a.p50LatencyMs.toLocaleString()} ms</td>
                        <td className="px-3 py-3 text-center text-[var(--text-secondary)] tabular-nums hidden lg:table-cell">{a.p95LatencyMs.toLocaleString()} ms</td>
                        <td className={`px-3 py-3 text-center font-semibold hidden sm:table-cell ${confColor}`}>
                          {Math.round(a.avgConfidenceScore * 100)}%
                        </td>
                        <td className={`px-3 py-3 text-center font-semibold hidden md:table-cell ${succColor}`}>
                          {Math.round(a.successRate * 100)}%
                        </td>
                        <td className="px-3 py-3 text-center">
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
              <span className="hidden lg:inline text-slate-400">|</span>
              <span className="hidden lg:inline">p50 / p95 = round-trip latency (ms)</span>
            </div>
          </div>

          {/* RAG declining confidence — alert (spec) */}
          <div
            className="mt-4 rounded-xl border-2 px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3"
            style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-red-900 text-sm">{p.ragConfidenceAlert.headline}</div>
              <div className="text-xs text-red-800/90 mt-1 leading-relaxed">{p.ragConfidenceAlert.detail}</div>
              <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-medium text-red-700">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 border border-red-200">
                  Δ confidence {p.ragConfidenceAlert.confidenceDeltaPp > 0 ? '+' : ''}{p.ragConfidenceAlert.confidenceDeltaPp} pp
                </span>
                <span className="text-red-600/80">{p.ragConfidenceAlert.periodCompare}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Expert Performance Distribution (3-bucket bar) ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--brand-blue)]" />
            Expert Performance Distribution
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Weekly composite score from CSAT, prep time, governance throughput, and Atlas adoption — {p.totalSessionsInPeriod} sessions in period.
          </p>
          <div className="card p-5">
            <div className="flex h-12 rounded-lg overflow-hidden border border-[var(--border-color)] mb-4">
              {p.expertPerformanceDistribution.map(b => (
                <div
                  key={b.label}
                  className="flex flex-col items-center justify-center text-white text-xs font-semibold px-1 transition-all hover:opacity-95"
                  style={{ width: `${b.pct}%`, background: b.color, minWidth: '12%' }}
                  title={`${b.label}: ${b.count} experts (${b.pct}%)`}
                >
                  <span className="hidden sm:inline text-[10px] opacity-90">{b.shortLabel}</span>
                  <span className="text-sm font-bold">{b.pct}%</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {p.expertPerformanceDistribution.map(b => (
                <div key={b.label} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-[var(--border-color)]">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{b.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{b.count} experts · {b.pct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature Adoption Depth ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Layers size={16} className="text-[var(--brand-blue)]" />
            Feature Adoption Depth
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            <strong className="text-[var(--text-secondary)]">Shallow</strong> = single visit / one screen ·{' '}
            <strong className="text-[var(--text-secondary)]">Deep</strong> = multi-step workflow or repeat use in period.
          </p>
          <div className="card p-5">
            <div style={{ height: Math.max(220, p.featureAdoptionDepth.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={p.featureAdoptionDepth.map(d => ({
                    name: d.feature.length > 28 ? d.feature.slice(0, 26) + '…' : d.feature,
                    full: d.feature,
                    shallow: d.shallowPct,
                    deep: d.deepPct,
                  }))}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={148}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = typeof value === 'number' ? value : Number(value);
                      const label = String(name) === 'shallow' ? 'Shallow' : 'Deep';
                      return [`${Number.isFinite(v) ? v : 0}%`, label];
                    }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                    labelFormatter={(_l, payload) => (Array.isArray(payload) && payload[0] && 'payload' in payload[0] ? (payload[0] as { payload?: { full?: string } }).payload?.full : undefined) ?? ''}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="shallow" stackId="ad" fill="#CBD5E1" name="Shallow" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="deep" stackId="ad" fill="#0077C5" name="Deep" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 px-4 py-3 rounded-lg border flex items-start gap-2" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <Star size={14} className="text-[var(--brand-blue)] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-[var(--brand-blue)]">Retention insight: </span>
                {p.featureAdoptionRetentionInsight}
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 4: Policy Override Analysis ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--brand-blue)]" />
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
            <Activity size={16} className="text-[var(--brand-blue)]" />
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
                      <tr key={t.month} className={`hover:bg-slate-50 transition-colors ${i === p.confidenceTrend.length - 1 ? 'bg-[var(--brand-blue-light)]' : ''}`}>
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
