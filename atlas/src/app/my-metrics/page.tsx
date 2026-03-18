'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Star, Users, Calendar, TrendingUp, ShieldCheck, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, BarChart3,
  AlertTriangle, Zap, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { marcusMetrics } from '@/data/mock/marcus-metrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function StatCard({
  label, value, sub, icon, accent = false, flag = false,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: boolean; flag?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'border-[var(--intuit-blue)] border-2 bg-[var(--intuit-blue-light)]' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[var(--intuit-blue)] text-white' : 'bg-slate-100 text-[var(--text-secondary)]'}`}>
          {icon}
        </div>
        {flag && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
      </div>
      <div className={`text-3xl font-bold mb-1 ${accent ? 'text-[var(--intuit-blue)]' : 'text-[var(--text-primary)]'}`}>{value}</div>
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

export default function MyMetricsPage() {
  const m = marcusMetrics;
  const [prepExpanded, setPrepExpanded] = useState(false);

  const weeklyData = m.weeklyTrend.map(w => ({
    name: w.week,
    'Sessions Completed': w.completed,
    'Briefs Generated': w.briefsGenerated,
  }));

  const prepBarData = m.prepTimeRecords.slice(0, 10).map(r => ({
    name: r.clientName.split(' ').slice(0, 2).join(' '),
    'Prep (min)': r.prepTimeMinutes,
    date: r.date,
  }));

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="My Metrics"
        subtitle={`${m.periodLabel} · ${m.periodStart} → ${m.periodEnd}`}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full space-y-8">

        {/* Expert identity strip */}
        <div className="card p-5 flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--intuit-blue)] text-white flex items-center justify-center text-xl font-bold shrink-0">
              MR
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)]">Marcus Rivera</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['CPA', 'QuickBooks ProAdvisor', 'TurboTax Live'].map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded bg-[var(--intuit-blue-light)] text-[var(--intuit-blue)] font-medium">{c}</span>
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

        {/* ── Section 1: Session Volume ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--intuit-blue)]" />
            Session Volume
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

          {/* Weekly trend chart */}
          <div className="card p-5 mt-4">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sessions per Week</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={24} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Sessions Completed" fill="#0077C5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Briefs Generated" fill="#FF6900" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Section 2: Client Diversity ── */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users size={16} className="text-[var(--intuit-blue)]" />
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
                        <div className="h-1.5 rounded-full bg-[var(--intuit-blue)]" style={{ width: `${(c.sessionsCount / 4) * 40}px` }} />
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
            <ShieldCheck size={16} className="text-[var(--intuit-blue)]" />
            Policy-Based Actions — {m.totalPolicyActions} total
          </h2>

          {/* Summary cards */}
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

          {/* By risk level */}
          <div className="card p-5 space-y-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Breakdown by Risk Level</div>

            <PolicyBar
              label="HIGH"
              breakdown={m.policyByRisk.HIGH}
              color="bg-red-100 text-red-700 border-red-200"
            />
            <PolicyBar
              label="MEDIUM"
              breakdown={m.policyByRisk.MEDIUM}
              color="bg-amber-100 text-amber-700 border-amber-200"
            />
            <PolicyBar
              label="LOW"
              breakdown={m.policyByRisk.LOW}
              color="bg-green-100 text-green-700 border-green-200"
            />

            <div className="flex items-center gap-4 pt-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Overridden</span>
              <span className="flex items-center gap-1.5 ml-auto text-[var(--text-muted)]">Remaining = not yet actioned</span>
            </div>
          </div>

          {/* Detail table */}
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
            <Clock size={16} className="text-[var(--intuit-blue)]" />
            Session Prep Time (Atlas AI Pipeline)
          </h2>

          {/* Headline stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="card p-5 text-center border-[var(--intuit-blue)] border-2 bg-[var(--intuit-blue-light)]">
              <div className="text-3xl font-bold text-[var(--intuit-blue)]">{m.avgPrepTimeMinutes}m</div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Average Prep Time</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">vs 40–60m manual (pre-Atlas)</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <ArrowDown size={18} className="text-green-500" />{m.minPrepTimeMinutes}m
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Fastest Prep</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Blue Ridge Bakery · Mar 13</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <ArrowUp size={18} className="text-amber-500" />{m.maxPrepTimeMinutes}m
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Longest Prep</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">Coastal Realty · Feb 28</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                <Minus size={18} className="text-slate-400" />{m.medianPrepTimeMinutes}m
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">Median</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">50th percentile</div>
            </div>
          </div>

          {/* Time savings callout */}
          <div className="card p-4 mb-5 bg-green-50 border-green-200 border">
            <div className="flex items-center gap-3">
              <div className="text-2xl shrink-0">⚡</div>
              <div>
                <div className="font-semibold text-green-800 text-sm">
                  Atlas saved Marcus ~{Math.round((40 - m.avgPrepTimeMinutes) * m.sessionsCompleted / 60)} hours this month
                </div>
                <div className="text-xs text-green-600 mt-0.5">
                  Average prep dropped from 40–60 min (manual) to {m.avgPrepTimeMinutes} min (Atlas AI pipeline) — across {m.sessionsCompleted} sessions
                </div>
              </div>
            </div>
          </div>

          {/* Prep time bar chart */}
          <div className="card p-5 mb-4">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Prep Time — Last 10 Sessions (minutes)</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepBarData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} unit="m" />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v) => [`${Number(v)}m`, 'Prep Time']}
                  />
                  <Bar
                    dataKey="Prep (min)"
                    fill="#0077C5"
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10, fill: '#94A3B8', formatter: (v: unknown) => `${v}m` }}
                  />
                </BarChart>
              </ResponsiveContainer>
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
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Prep</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Session</th>
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
                            {r.prepTimeMinutes}m
                          </span>
                          {isMax && <span className="ml-1 text-xs text-amber-500">↑ max</span>}
                          {isMin && <span className="ml-1 text-xs text-green-500">↓ min</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center hidden sm:table-cell text-xs text-[var(--text-muted)]">
                          {r.sessionDurationMinutes > 0 ? `${r.sessionDurationMinutes}m` : '—'}
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
