'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Star, Users, Calendar, TrendingUp, ShieldCheck, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  AlertTriangle, Zap, ArrowUp, ArrowDown, Minus, Bot,
  Sparkles, Building2,
} from 'lucide-react';
import { marcusMetrics } from '@/data/mock/marcus-metrics';

// ── Derived constants ─────────────────────────────────────────────────────────
const m = marcusMetrics;

// Prep-time savings vs manual baseline of 40 min
const prepSavingsHours = +((40 - m.avgPrepTimeMinutes) * m.sessionsCompleted / 60).toFixed(1);

// LOW-risk automated approval savings:
// Each LOW action was auto-approved without Marcus's manual review.
// Assume 3 min of manual review time saved per automated LOW action.
const lowAutoApprovals = m.policyByRisk.LOW.approved;     // 11
const lowAutoSavingsMins = lowAutoApprovals * 3;           // 33 min
const lowAutoSavingsHours = +(lowAutoSavingsMins / 60).toFixed(1); // 0.6

const totalAiSavingsHours = +(prepSavingsHours + lowAutoSavingsHours).toFixed(1);

// Entity type CSAT roll-up
const entityCsat: Record<string, { totalCsat: number; count: number }> = {};
m.topClients.forEach(c => {
  if (!entityCsat[c.entityType]) entityCsat[c.entityType] = { totalCsat: 0, count: 0 };
  entityCsat[c.entityType].totalCsat += c.avgCsat * c.sessionsCount;
  entityCsat[c.entityType].count += c.sessionsCount;
});
const entityPerf = Object.entries(entityCsat)
  .map(([type, { totalCsat, count }]) => ({ type, avgCsat: +(totalCsat / count).toFixed(2), sessions: count }))
  .sort((a, b) => b.avgCsat - a.avgCsat);

// High-risk session pattern: sessions that had HIGH actions
const highRiskSessions = m.prepTimeRecords.filter(r =>
  ['Meridian Home Goods', 'Coastal Realty Partners', 'TechStart Consulting'].includes(r.clientName)
);
const highRiskAvgPrep = +(highRiskSessions.reduce((s, r) => s + r.prepTimeMinutes, 0) / highRiskSessions.length).toFixed(1);
const lowRiskSessions = m.prepTimeRecords.filter(r =>
  ['Blue Ridge Bakery', 'Apex Landscaping LLC', 'Harbor Light Brewing'].includes(r.clientName)
);
const lowRiskAvgPrep = +(lowRiskSessions.reduce((s, r) => s + r.prepTimeMinutes, 0) / lowRiskSessions.length).toFixed(1);

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, accent = false, flag = false,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: boolean; flag?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'border-[var(--brand-blue)] border-2 bg-[var(--brand-blue-light)]' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[var(--brand-blue)] text-white' : 'bg-slate-100 text-[var(--text-secondary)]'}`}>
          {icon}
        </div>
        {flag && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
      </div>
      <div className={`text-3xl font-bold mb-1 ${accent ? 'text-[var(--brand-blue)]' : 'text-[var(--text-primary)]'}`}>{value}</div>
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

function PolicyBar({ label, breakdown, color }: {
  label: string;
  breakdown: { total: number; approved: number; overridden: number };
  color: string;
}) {
  const approveWidth = breakdown.total > 0 ? (breakdown.approved / breakdown.total) * 100 : 0;
  const overrideWidth = breakdown.total > 0 ? (breakdown.overridden / breakdown.total) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
      </div>
      <div className="flex-1">
        <div className="flex h-6 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          <div
            className="bg-green-500 flex items-center justify-center"
            style={{ width: `${approveWidth}%` }}
            title={`Approved: ${breakdown.approved}`}
          >
            {breakdown.approved > 0 && (
              <span className="text-[10px] font-bold text-white px-1">{breakdown.approved}</span>
            )}
          </div>
          <div
            className="bg-red-400 flex items-center justify-center"
            style={{ width: `${overrideWidth}%` }}
            title={`Overridden: ${breakdown.overridden}`}
          >
            {breakdown.overridden > 0 && (
              <span className="text-[10px] font-bold text-white px-1">{breakdown.overridden}</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-[var(--text-muted)] w-20 text-right shrink-0">
        {breakdown.total} total
      </div>
    </div>
  );
}

// ── Inline highlight for the AI summary ──────────────────────────────────────
function Hi({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'orange' | 'red' }) {
  const cls = {
    blue: 'bg-[var(--brand-blue-light)] text-[var(--brand-blue)]',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-700',
  }[color];
  return (
    <span className={`inline-flex items-center font-semibold px-1.5 py-0.5 rounded mx-0.5 text-[0.85em] ${cls}`}>
      {children}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyMetricsPage() {
  const [prepExpanded, setPrepExpanded] = useState(false);

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="My Metrics"
        subtitle={`${m.periodLabel} · ${m.periodStart} → ${m.periodEnd}`}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full space-y-8">

        {/* ── AI-Generated Summary ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[var(--brand-blue-light)] to-white border-b border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-blue)] flex items-center justify-center shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">AI-Generated Performance Summary</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">Atlas AI</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">Feb 17 – Mar 18, 2025 · Auto-generated from session and governance data</div>
            </div>
            <Sparkles size={16} className="ml-auto text-[var(--accent-orange)] shrink-0" />
          </div>

          <div className="p-5 space-y-5">

            {/* Client Coverage */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Client Coverage</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Marcus completed <Hi color="blue">{m.sessionsCompleted} sessions</Hi> across
                <Hi color="blue">{m.uniqueClientsServed} unique clients</Hi> this month —
                <Hi color="green">{m.newClientsOnboarded} newly onboarded</Hi> and
                <Hi color="blue">{m.repeatClients} returning</Hi>.
                His completion rate of <Hi color="green">{Math.round(m.completionRate * 100)}%</Hi> is
                above the platform average of 88%. S-Corp entities dominate his book of work
                ({m.topClients.filter(c => c.entityType === 'S-Corp').length} of {m.topClients.length} tracked clients),
                followed by LLCs and one sole proprietor.
              </p>
            </div>

            {/* Hours saved */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">AI Time Savings</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Atlas AI reclaimed an estimated <Hi color="green">~{totalAiSavingsHours} hours</Hi> for Marcus this month.
                <Hi color="green">{prepSavingsHours} hours</Hi> came from automated session prep
                (avg {m.avgPrepTimeMinutes} min per session vs 40-min manual baseline across {m.sessionsCompleted} sessions).
                An additional <Hi color="green">{lowAutoSavingsMins} minutes</Hi> were saved through automated
                approval of <Hi color="blue">{lowAutoApprovals} LOW-risk policy actions</Hi> that required no manual
                review — Atlas classified and closed these autonomously with 100% acceptance.
              </p>
            </div>

            {/* CSAT */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">CSAT & Quality</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Marcus is tracking at <Hi color="green">{m.csatTrailing30} / 5.0 CSAT</Hi> for the trailing 30 days.
                Top-rated sessions were with <Hi color="blue">Apex Landscaping</Hi> and <Hi color="blue">Harbor Light Brewing</Hi> (both 5.0).
                AI confidence averaged <Hi color="blue">{Math.round(m.avgConfidenceScore * 100)}%</Hi> across all agent outputs,
                and <Hi color="blue">94%</Hi> of sessions used an Atlas-generated pre-session brief.
              </p>
            </div>

            {/* Entity type AI performance */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">AI Accuracy by Entity Type</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                AI-recommended actions are performing strongest for <Hi color="green">S-Corp clients</Hi>,
                where the policy approval rate is highest and CSAT averages{' '}
                <Hi color="green">{entityPerf.find(e => e.type === 'S-Corp')?.avgCsat ?? '—'}</Hi>.
                S-Corps generate well-structured, pattern-matchable scenarios (reasonable compensation, Section 179,
                payroll compliance) that Atlas handles with high confidence.
                <Hi color="blue">LLC clients</Hi> show slightly more variance —
                Coastal Realty Partners required the longest prep time ({m.maxPrepTimeMinutes} min)
                due to mixed-use real estate complexity that fell outside standard policy templates.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {entityPerf.map(e => (
                  <div key={e.type} className="p-3 rounded-lg bg-slate-50 border border-[var(--border-color)] text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Building2 size={11} className="text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{e.type}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{e.avgCsat}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{e.sessions} sessions</div>
                  </div>
                ))}
              </div>
            </div>

            {/* High risk / cognitive judgment pattern */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">High-Risk & Cognitive Judgment Pattern</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Sessions involving <Hi color="red">HIGH-risk policy findings</Hi> (9 this month) consistently required
                more expert judgment and longer prep time. Clients like <Hi color="orange">Meridian Home Goods</Hi> and{' '}
                <Hi color="orange">Coastal Realty Partners</Hi> averaged <Hi color="orange">{highRiskAvgPrep} min</Hi> of prep
                vs <Hi color="green">{lowRiskAvgPrep} min</Hi> for lower-risk clients — a{' '}
                {Math.round(((highRiskAvgPrep - lowRiskAvgPrep) / lowRiskAvgPrep) * 100)}% increase reflecting the
                additional reasoning required around contractor misclassification, complex deduction eligibility,
                and S-Corp compensation reviews. These <Hi color="red">3 overridden</Hi> HIGH-risk recommendations
                represent cases where Marcus&apos;s expert judgment diverged from the AI — a signal for model
                refinement in real estate and multi-entity scenarios.
              </p>
            </div>

          </div>
        </div>

        {/* ── Expert identity strip ── */}
        <div className="card p-5 flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--brand-blue)] text-white flex items-center justify-center text-xl font-bold shrink-0">
              MR
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)]">Marcus Rivera</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['CPA', 'QuickBooks ProAdvisor', 'TurboTax Live'].map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium">{c}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-1 justify-center">
                <Star size={18} className="text-amber-400 fill-amber-400" />{m.csatTrailing30}
              </div>
              <div className="text-xs text-[var(--text-muted)]">CSAT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(m.atlasAdoptionRate * 100)}%</div>
              <div className="text-xs text-[var(--text-muted)]">Atlas Adoption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(m.avgConfidenceScore * 100)}%</div>
              <div className="text-xs text-[var(--text-muted)]">Avg AI Confidence</div>
            </div>
          </div>
        </div>

        {/* ── Section 1: Session Volume — Monthly ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--brand-blue)]" />
            Session Volume — Monthly
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Sessions Completed"
              value={m.sessionsCompleted}
              sub={`of ${m.sessionsScheduled} scheduled`}
              icon={<CheckCircle2 size={18} />}
              accent
            />
            <StatCard
              label="Completion Rate"
              value={`${Math.round(m.completionRate * 100)}%`}
              sub="vs 88% platform avg"
              icon={<TrendingUp size={18} />}
            />
            <StatCard
              label="Unique Clients"
              value={m.uniqueClientsServed}
              sub={`${m.newClientsOnboarded} new · ${m.repeatClients} repeat`}
              icon={<Users size={18} />}
            />
            <StatCard
              label="Briefs Generated"
              value={m.weeklyTrend.reduce((s, w) => s + w.briefsGenerated, 0)}
              sub={`${Math.round(m.atlasAdoptionRate * 100)}% Atlas adoption`}
              icon={<Zap size={18} />}
            />
          </div>

          {/* Monthly trend table (no chart) */}
          <div className="card overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">6-Month Trend</span>
              <span className="text-xs text-[var(--text-muted)]">Sessions · Briefs · Unique Clients</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Month</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sessions</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Briefs</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Unique Clients</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Atlas %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {m.monthlyTrend.map((mo, i) => {
                    const isLatest = i === m.monthlyTrend.length - 1;
                    const atlasRate = Math.round((mo.briefsGenerated / mo.completed) * 100);
                    return (
                      <tr key={mo.month} className={`transition-colors ${isLatest ? 'bg-[var(--brand-blue-light)]' : 'hover:bg-slate-50'}`}>
                        <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                          {mo.month}
                          {isLatest && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--brand-blue)] text-white font-semibold">Current</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="h-1.5 rounded-full bg-[var(--brand-blue)] opacity-70" style={{ width: `${(mo.completed / 22) * 36}px` }} />
                            <span className="font-semibold text-[var(--text-primary)]">{mo.completed}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{mo.briefsGenerated}</td>
                        <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{mo.uniqueClients}</td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`text-xs font-medium ${atlasRate >= 90 ? 'text-green-600' : atlasRate >= 75 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {atlasRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Section 2: Client Diversity ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users size={16} className="text-[var(--brand-blue)]" />
            Clients Worked With ({m.uniqueClientsServed} unique)
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--border-color)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Entity</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sessions</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {m.topClients.map((c, i) => (
                  <tr key={c.clientName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] w-5 text-right shrink-0">#{i + 1}</span>
                        <span className="font-medium text-[var(--text-primary)]">{c.clientName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{c.entityType}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-1.5 rounded-full bg-[var(--brand-blue)]" style={{ width: `${(c.sessionsCount / 4) * 40}px` }} />
                        <span className="text-[var(--text-primary)] font-medium">{c.sessionsCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="font-medium text-[var(--text-primary)]">{c.avgCsat.toFixed(1)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 3: Policy Actions ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--brand-blue)]" />
            Policy-Based Actions — {m.totalPolicyActions} total
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">{m.totalPolicyActions}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Total Actions</div>
            </div>
            <div className="card p-4 text-center border-green-200 bg-green-50">
              <div className="text-3xl font-bold text-green-700 flex items-center justify-center gap-1">
                <CheckCircle2 size={20} className="text-green-600" />{m.totalApproved}
              </div>
              <div className="text-xs text-green-600 mt-1 font-medium">Approved</div>
              <div className="text-xs text-green-500">{Math.round((m.totalApproved / m.totalPolicyActions) * 100)}% of total</div>
            </div>
            <div className="card p-4 text-center border-red-200 bg-red-50">
              <div className="text-3xl font-bold text-red-700 flex items-center justify-center gap-1">
                <XCircle size={20} className="text-red-600" />{m.totalOverridden}
              </div>
              <div className="text-xs text-red-600 mt-1 font-medium">Overridden</div>
              <div className="text-xs text-red-500">{Math.round((m.totalOverridden / m.totalPolicyActions) * 100)}% of total</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {Math.round((m.totalApproved / m.totalPolicyActions) * 100)}%
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Approval Rate</div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Breakdown by Risk Level</div>
            <PolicyBar label="HIGH" breakdown={m.policyByRisk.HIGH} color="bg-red-100 text-red-700 border-red-200" />
            <PolicyBar label="MEDIUM" breakdown={m.policyByRisk.MEDIUM} color="bg-amber-100 text-amber-700 border-amber-200" />
            <PolicyBar label="LOW" breakdown={m.policyByRisk.LOW} color="bg-green-100 text-green-700 border-green-200" />
            <div className="flex items-center gap-4 pt-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Overridden</span>
              <span className="flex items-center gap-1.5 ml-auto text-[var(--text-muted)]">Remaining = not yet actioned</span>
            </div>
          </div>

          <div className="card overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--border-color)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Risk Level</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1 text-green-600"><CheckCircle2 size={11} />Approved</span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1 text-red-500"><XCircle size={11} />Overridden</span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {(['HIGH', 'MEDIUM', 'LOW'] as const).map(risk => {
                  const row = m.policyByRisk[risk];
                  const rate = row.total > 0 ? Math.round((row.approved / row.total) * 100) : 0;
                  return (
                    <tr key={risk} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          risk === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                          risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-green-100 text-green-700 border-green-200'
                        }`}>{risk}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">{row.total}</td>
                      <td className="px-4 py-3 text-center text-green-700 font-semibold">{row.approved}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold">{row.overridden}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs font-medium ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold border-t-2 border-[var(--border-strong)]">
                  <td className="px-5 py-3 text-[var(--text-primary)]">Total</td>
                  <td className="px-4 py-3 text-center text-[var(--text-primary)]">{m.totalPolicyActions}</td>
                  <td className="px-4 py-3 text-center text-green-700">{m.totalApproved}</td>
                  <td className="px-4 py-3 text-center text-red-600">{m.totalOverridden}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-[var(--text-primary)]">
                    {Math.round((m.totalApproved / m.totalPolicyActions) * 100)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 4: Session Prep Time ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock size={16} className="text-[var(--brand-blue)]" />
            Session Prep Time (Atlas AI Pipeline)
          </h2>

          {/* Headline stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="card p-5 text-center border-[var(--brand-blue)] border-2 bg-[var(--brand-blue-light)]">
              <div className="text-3xl font-bold text-[var(--brand-blue)]">{m.avgPrepTimeMinutes} <span className="text-xl">min</span></div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Average Prep Time</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">vs 40–60 min manual (pre-Atlas)</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <ArrowDown size={18} className="text-green-500" />{m.minPrepTimeMinutes} <span className="text-xl font-normal">min</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Fastest Prep</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Blue Ridge Bakery · Mar 13</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <ArrowUp size={18} className="text-amber-500" />{m.maxPrepTimeMinutes} <span className="text-xl font-normal">min</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Longest Prep</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Coastal Realty · Feb 28</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <Minus size={18} className="text-slate-400" />{m.medianPrepTimeMinutes} <span className="text-xl font-normal">min</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Median</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">50th percentile</div>
            </div>
          </div>

          {/* Combined time savings breakdown */}
          <div className="card p-5 mb-5 bg-green-50 border-green-200 border space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xl">⚡</div>
              <span className="font-semibold text-green-800 text-sm">
                Total AI time savings this month: ~{totalAiSavingsHours} hours
              </span>
            </div>

            {/* Row 1: Prep time savings */}
            <div className="flex items-start gap-3 pl-1">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Session prep automation — <span className="font-bold">{prepSavingsHours} hours saved</span>
                </div>
                <div className="text-xs text-green-700 mt-0.5">
                  Avg prep dropped from 40 min (manual) to {m.avgPrepTimeMinutes} min (Atlas AI pipeline) across {m.sessionsCompleted} sessions.
                  That&apos;s {Math.round(40 - m.avgPrepTimeMinutes)} minutes recovered per session.
                </div>
              </div>
            </div>

            {/* Row 2: Automated LOW approvals */}
            <div className="flex items-start gap-3 pl-1">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Automated LOW-risk approvals — <span className="font-bold">{lowAutoSavingsMins} minutes saved</span>
                </div>
                <div className="text-xs text-green-700 mt-0.5">
                  {lowAutoApprovals} LOW-risk policy actions were classified and autonomously approved by Atlas
                  with no manual review required — saving ~3 min each.
                  These included routine deduction confirmations, standard depreciation elections, and
                  expense categorisation with high-confidence matches.
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                    {lowAutoApprovals} actions auto-approved
                  </span>
                  <span className="text-xs text-green-600">100% acceptance · 0 overrides</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed prep log */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setPrepExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-[var(--border-color)]"
            >
              <span className="text-sm font-semibold text-[var(--text-primary)]">Full Prep Time Log ({m.prepTimeRecords.length} sessions)</span>
              {prepExpanded ? <ChevronUp size={15} className="text-[var(--text-muted)]" /> : <ChevronDown size={15} className="text-[var(--text-muted)]" />}
            </button>
            {prepExpanded && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[var(--border-color)]">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Client</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Prep (min)</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Session (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {m.prepTimeRecords.map((r, i) => {
                    const isMax = r.prepTimeMinutes === m.maxPrepTimeMinutes;
                    const isMin = r.prepTimeMinutes === m.minPrepTimeMinutes;
                    return (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${isMax ? 'bg-amber-50' : isMin ? 'bg-green-50' : ''}`}>
                        <td className="px-5 py-2.5 text-xs text-[var(--text-muted)]">{r.date}</td>
                        <td className="px-4 py-2.5 text-[var(--text-primary)] font-medium text-sm">{r.clientName}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-sm font-semibold ${isMax ? 'text-amber-600' : isMin ? 'text-green-600' : 'text-[var(--text-primary)]'}`}>
                            {r.prepTimeMinutes} min
                          </span>
                          {isMax && <span className="ml-1 text-xs text-amber-500">↑ max</span>}
                          {isMin && <span className="ml-1 text-xs text-green-500">↓ min</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center hidden sm:table-cell text-xs text-[var(--text-muted)]">
                          {r.sessionDurationMinutes > 0 ? `${r.sessionDurationMinutes} min` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
