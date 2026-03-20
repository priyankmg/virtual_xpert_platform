'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import {
  Database, FileText, ShieldCheck, Search, Calculator,
  ClipboardList, Play, Loader2, CheckCircle2,
  XCircle, ArrowRight, ChevronDown, ChevronUp, Zap,
  AlertTriangle, HeartPulse, GitCompare, RefreshCw,
  CheckCheck, FileWarning, TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────── */
type AgentStatus = 'idle' | 'loading' | 'success' | 'error';

interface AgentState {
  status: AgentStatus;
  lastRun?: string;
  durationMs?: number;
  output?: string;
  outputDetails?: Record<string, unknown>;
  error?: string;
}

/* ─── Helpers ─────────────────────────────────────────── */
function fmt(n: number) { return '$' + n.toLocaleString(); }

async function fetchSnapshot() {
  const res = await fetch('/api/das/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'CLIENT-001' }),
  });
  if (!res.ok) throw new Error('DAS failed');
  return res.json();
}

/* ─── Agent runner map ────────────────────────────────── */
type Runner = () => Promise<{ summary: string; details: Record<string, unknown> }>;

const RUNNERS: Record<string, Runner> = {
  das: async () => {
    const snap = await fetchSnapshot();
    return {
      summary: `Aggregated 6 source systems. Revenue: ${fmt(snap.accounting.revenue)}, Net Income: ${fmt(snap.accounting.netIncome)}. ${snap.reconciliationFlags.length} reconciliation flag(s), ${snap.dataGaps.length} data gap(s).`,
      details: {
        Revenue: fmt(snap.accounting.revenue),
        'Net Income': fmt(snap.accounting.netIncome),
        'Total Payroll': fmt(snap.payroll.totalWages),
        'Flagged Expenses': fmt(snap.expenses.flagged),
        'Reconciliation Flags': snap.reconciliationFlags.length,
        'Data Gaps': snap.dataGaps.length,
      },
    };
  },

  summarizer: async () => {
    const snap = await fetchSnapshot();
    const res = await fetch('/api/agents/summarizer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: snap, audienceType: 'expert' }),
    });
    const data = await res.json();
    return {
      summary: data.executiveSummary,
      details: {
        'High Severity Items': data.attentionItems?.filter((i: { severity: string }) => i.severity === 'HIGH').length ?? 0,
        'Medium Severity Items': data.attentionItems?.filter((i: { severity: string }) => i.severity === 'MEDIUM').length ?? 0,
        'Ready for Session': data.readyForExpertSession ? 'Yes' : 'No',
        'Key Metrics': data.keyMetrics?.length ?? 0,
      },
    };
  },

  policy: async () => {
    const snap = await fetchSnapshot();
    const res = await fetch('/api/agents/policy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: snap }),
    });
    const data = await res.json();
    return {
      summary: `Overall risk: ${data.overallRiskLevel}. Found ${data.findings.length} policy findings across 7 areas. ${data.findings.filter((f: { riskLevel: string }) => f.riskLevel === 'HIGH').length} HIGH risk items. ${data.deductionOpportunities.length} deduction opportunities worth ${fmt(data.deductionOpportunities.reduce((s: number, d: { estimatedValue: number }) => s + d.estimatedValue, 0))}.`,
      details: {
        'Overall Risk': data.overallRiskLevel,
        'Total Findings': data.findings.length,
        'HIGH Risk': data.findings.filter((f: { riskLevel: string }) => f.riskLevel === 'HIGH').length,
        'MEDIUM Risk': data.findings.filter((f: { riskLevel: string }) => f.riskLevel === 'MEDIUM').length,
        'Deduction Opportunities': fmt(data.deductionOpportunities.reduce((s: number, d: { estimatedValue: number }) => s + d.estimatedValue, 0)),
        'Compliance Deadlines': data.complianceGaps.length,
        'Expert Review Required': data.expertReviewRequired ? 'Yes' : 'No',
      },
    };
  },

  rag_contractor: async () => {
    const res = await fetch('/api/agents/rag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'contractor misclassification employee 1099 payroll tax', clientId: 'CLIENT-001' }),
    });
    const data = await res.json();
    return {
      summary: `Retrieved ${data.precedents.length} relevant IRS precedents for contractor classification. Top match: "${data.precedents[0]?.title}" (${(data.precedents[0]?.relevanceScore * 100).toFixed(0)}% relevance).`,
      details: Object.fromEntries(data.precedents.slice(0, 4).map((p: { title: string; year: number; taxpayerOutcome: string; relevanceScore: number }, i: number) => [
        `Case ${i + 1}`, `${p.title} (${p.year}) — ${p.taxpayerOutcome?.split(' — ')[0] ?? '—'}`,
      ])),
    };
  },

  rag_meals: async () => {
    const res = await fetch('/api/agents/rag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'meals entertainment business purpose 274 TCJA deduction', clientId: 'CLIENT-001' }),
    });
    const data = await res.json();
    return {
      summary: `Retrieved ${data.precedents.length} precedents on meals & entertainment. Confidence: ${(data.confidenceInRelevance * 100).toFixed(0)}%.`,
      details: Object.fromEntries(data.precedents.slice(0, 4).map((p: { title: string; year: number; taxpayerOutcome: string; relevanceScore: number }, i: number) => [
        `Case ${i + 1}`, `${p.title} (${p.year}) — ${p.taxpayerOutcome?.split(' — ')[0] ?? '—'}`,
      ])),
    };
  },

  rag_scorp: async () => {
    const res = await fetch('/api/agents/rag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'S-Corp reasonable compensation QBI 199A distributions officer salary', clientId: 'CLIENT-001' }),
    });
    const data = await res.json();
    return {
      summary: `Retrieved ${data.precedents.length} precedents on S-Corp compensation. Top match: "${data.precedents[0]?.title}".`,
      details: Object.fromEntries(data.precedents.slice(0, 4).map((p: { title: string; year: number; taxpayerOutcome: string; relevanceScore: number }, i: number) => [
        `Case ${i + 1}`, `${p.title} (${p.year}) — ${p.taxpayerOutcome?.split(' — ')[0] ?? '—'}`,
      ])),
    };
  },

  tax: async () => {
    const snap = await fetchSnapshot();
    const res = await fetch('/api/agents/tax-classifier', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: snap }),
    });
    const data = await res.json();
    return {
      summary: `Tax Year ${data.taxYear} estimate complete. Base scenario: ${fmt(data.scenarios.base.totalLiability)}, Conservative: ${fmt(data.scenarios.conservative.totalLiability)}, Optimistic: ${fmt(data.scenarios.optimistic.totalLiability)}. Confidence: ${(data.confidenceScore * 100).toFixed(0)}%.`,
      details: {
        'Base Liability': fmt(data.scenarios.base.totalLiability),
        'Conservative Liability': fmt(data.scenarios.conservative.totalLiability),
        'Optimistic Liability': fmt(data.scenarios.optimistic.totalLiability),
        'vs. Prior Year': `${data.priorYearComparison.change > 0 ? '+' : ''}${fmt(data.priorYearComparison.change)} (${data.priorYearComparison.changePercent.toFixed(1)}%)`,
        'Confidence Score': `${(data.confidenceScore * 100).toFixed(0)}%`,
        'Expert Review': data.expertReviewRecommended ? 'Recommended' : 'Not required',
      },
    };
  },

  pipeline: async () => {
    const res = await fetch('/api/agents/orchestrate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'CLIENT-001' }),
    });
    const data = await res.json();
    return {
      summary: `Full pipeline complete in ${(data.totalDurationMs / 1000).toFixed(1)}s. All 6 agents ran successfully. Session brief is ready for export.`,
      details: {
        'Pipeline Duration': `${(data.totalDurationMs / 1000).toFixed(1)}s`,
        'Net Income': fmt(data.snapshot.accounting.netIncome),
        'Overall Risk': data.policyReport.overallRiskLevel,
        'Tax Estimate (Base)': fmt(data.taxEstimate.scenarios.base.totalLiability),
        'Attention Items': data.summary.attentionItems.length,
        'IRS Precedents': data.ragResult.precedents.length,
      },
    };
  },

  health: async () => {
    const res = await fetch('/api/agents/health');
    const data = await res.json();
    const healthySystems = data.systems.filter((s: { status: string }) => s.status === 'HEALTHY' || s.status === 'RECOVERED').length;
    const downSystems = data.systems.filter((s: { status: string }) => s.status === 'DOWN').length;
    return {
      summary: `System health: ${data.overallStatus}. ${healthySystems}/${data.systems.length} source systems healthy. ${data.healingActionsCount} self-healing action(s) taken. ${data.cacheHits} cache fallback(s). ${data.recommendation}`,
      details: {
        'Overall Status': data.overallStatus,
        'Healthy Systems': `${healthySystems} / ${data.systems.length}`,
        'Self-Healing Actions': data.healingActionsCount,
        'Cache Fallbacks': data.cacheHits,
        'Agents Monitored': data.agentStatus?.length ?? 0,
        'Checked At': new Date(data.checkedAt).toLocaleTimeString(),
      },
    };
  },
};

/* ─── Agent definitions ───────────────────────────────── */
interface AgentDef {
  id: string;
  runnerId: string;
  name: string;
  plane: string;
  actionType: 'READ' | 'ADVISORY' | 'ACTION';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  useCase: string;
  description: string;
  btnLabel: string;
  dependsOn?: string;
  linkTo?: string;
  linkLabel?: string;
}

const AGENT_GROUPS: { label: string; agents: AgentDef[] }[] = [
  {
    label: 'Data & Retrieval',
    agents: [
      {
        id: 'das', runnerId: 'das',
        name: 'Data Aggregation Service', plane: 'Stack Plane', actionType: 'READ',
        icon: Database, iconBg: '#EFF6FF', iconColor: '#0077C5',
        useCase: 'Aggregate all 6 source systems into a unified financial snapshot',
        description: 'Pulls from QuickBooks, ADP, Expensify, Stripe, Inventory, and Prior Tax Returns. Detects reconciliation gaps and data gaps.',
        btnLabel: 'Aggregate Financial Data',
        linkTo: '/financial-snapshot', linkLabel: 'View Snapshot →',
      },
      {
        id: 'rag_contractor', runnerId: 'rag_contractor',
        name: 'IRS Precedents · Contractor Risk', plane: 'Stack Plane', actionType: 'READ',
        icon: Search, iconBg: '#FEF3C7', iconColor: '#D97706',
        useCase: 'Find IRS cases on worker misclassification and 1099 contractor risk',
        description: 'Searches the IRS precedent library for contractor vs. employee rulings relevant to Meridian\'s 4 contractors ($184K payments YTD).',
        btnLabel: 'Find Contractor Precedents',
        linkTo: '/precedents', linkLabel: 'Browse All Precedents →',
      },
      {
        id: 'rag_meals', runnerId: 'rag_meals',
        name: 'IRS Precedents · Meals & Entertainment', plane: 'Stack Plane', actionType: 'READ',
        icon: Search, iconBg: '#FEF3C7', iconColor: '#D97706',
        useCase: 'Find IRS rulings on meals, entertainment, and IRC 274 deductibility',
        description: 'Retrieves precedents on the post-TCJA 50% meal limit and entertainment disallowance. Relevant to $18K in flagged entertainment expenses.',
        btnLabel: 'Find Meals & Entertainment Cases',
        linkTo: '/precedents', linkLabel: 'Browse All Precedents →',
      },
      {
        id: 'rag_scorp', runnerId: 'rag_scorp',
        name: 'IRS Precedents · S-Corp Compensation', plane: 'Stack Plane', actionType: 'READ',
        icon: Search, iconBg: '#FEF3C7', iconColor: '#D97706',
        useCase: 'Find rulings on S-Corp reasonable compensation and QBI deduction eligibility',
        description: 'Searches for IRS cases on S-Corp officer salary reasonableness and IRC 199A pass-through deduction eligibility for Meridian.',
        btnLabel: 'Find S-Corp Cases',
        linkTo: '/precedents', linkLabel: 'Browse All Precedents →',
      },
    ],
  },
  {
    label: 'Analysis & Advisory',
    agents: [
      {
        id: 'summarizer', runnerId: 'summarizer',
        name: 'Summarizer Agent', plane: 'Business Plane', actionType: 'ADVISORY',
        icon: FileText, iconBg: '#F0FDF4', iconColor: '#16A34A',
        useCase: 'Generate an executive summary of Sarah Chen\'s financial position',
        description: 'Takes the financial snapshot and produces a 3-sentence executive summary, key metrics table, and prioritized attention items for the expert session.',
        btnLabel: 'Generate Financial Summary',
        dependsOn: 'DAS snapshot',
        linkTo: '/session-brief', linkLabel: 'View Full Session Brief →',
      },
      {
        id: 'policy', runnerId: 'policy',
        name: 'Policy Evaluation Agent', plane: 'Business Plane', actionType: 'ADVISORY',
        icon: ShieldCheck, iconBg: '#FEF2F2', iconColor: '#DC2626',
        useCase: 'Evaluate IRS compliance across expenses, payroll, depreciation, and QBI',
        description: 'Runs Meridian\'s financials against IRS Publications 535, 15, 946 and IRC 199A. Flags non-deductible expenses, payroll gaps, and deduction opportunities.',
        btnLabel: 'Run IRS Compliance Check',
        dependsOn: 'DAS snapshot',
        linkTo: '/policy-review', linkLabel: 'View Full Policy Report →',
      },
      {
        id: 'tax', runnerId: 'tax',
        name: 'Tax Estimation Classifier', plane: 'Business Plane', actionType: 'ADVISORY',
        icon: Calculator, iconBg: '#FFF7ED', iconColor: '#EA580C',
        useCase: 'Estimate 2025 federal and California tax liability in 3 scenarios',
        description: 'Models conservative, base, and optimistic tax outcomes based on current financials, flagged deductions, and QBI eligibility. Includes quarterly payment schedule.',
        btnLabel: 'Estimate Tax Liability',
        dependsOn: 'DAS snapshot',
        linkTo: '/tax-estimate', linkLabel: 'View Tax Estimate →',
      },
    ],
  },
  {
    label: 'Full Pipeline',
    agents: [
      {
        id: 'pipeline', runnerId: 'pipeline',
        name: 'Full Orchestrated Pipeline', plane: 'Orchestration Plane', actionType: 'ADVISORY',
        icon: Zap, iconBg: '#EFF6FF', iconColor: '#0077C5',
        useCase: 'Run all 6 agents sequentially and generate a complete expert session brief',
        description: 'DAS → Summarizer + Policy + Tax Classifier (parallel) → RAG Agent. Produces the full Session Brief with all agent outputs in one pass.',
        btnLabel: 'Run Full Pipeline',
        linkTo: '/session-brief', linkLabel: 'View Session Brief →',
      },
    ],
  },
  {
    label: 'Platform Health',
    agents: [
      {
        id: 'health', runnerId: 'health',
        name: 'Self-Healing API Agent', plane: 'Orchestration Plane', actionType: 'READ',
        icon: HeartPulse, iconBg: '#F0FDF4', iconColor: '#16A34A',
        useCase: 'Monitor all source systems and agents — retry on failure, fall back to cache',
        description: 'Pings all 6 source system integrations and 7 internal agents. Detects failures, retries with exponential backoff (up to 3 attempts), falls back to cached data, and logs all recovery actions to the governance store.',
        btnLabel: 'Run Health Check',
        linkTo: '/governance', linkLabel: 'View Recovery Log →',
      },
    ],
  },
];

/* ─── Agent Card ──────────────────────────────────────── */
function AgentCard({ agent, state, onRun }: { agent: AgentDef; state: AgentState; onRun: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = agent.icon;

  const statusColor = state.status === 'success' ? 'text-green-600' : state.status === 'error' ? 'text-red-500' : 'text-slate-400';
  const statusBg = state.status === 'success' ? 'bg-green-50 border-green-200' : state.status === 'error' ? 'bg-red-50 border-red-200' : '';

  return (
    <div className={`card overflow-hidden transition-all ${state.status === 'loading' ? 'shadow-md' : ''}`}>
      <div className="p-5">
        {/* Card header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: agent.iconBg }}>
            <Icon size={18} style={{ color: agent.iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>{agent.name}</span>
              <span className={`flex-shrink-0 ${agent.actionType === 'READ' ? 'badge-read' : agent.actionType === 'ADVISORY' ? 'badge-advisory' : 'badge-action'}`}>
                {agent.actionType}
              </span>
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#94A3B8' }}>{agent.plane}</div>
          </div>
        </div>

        {/* Use case — highlighted */}
        <div className="px-3 py-2 rounded-lg mb-3 text-xs font-semibold" style={{ background: agent.iconBg, color: agent.iconColor }}>
          {agent.useCase}
        </div>

        <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748B' }}>{agent.description}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {agent.dependsOn && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
              <ArrowRight size={11} />
              Requires {agent.dependsOn}
            </span>
          )}
          {agent.linkTo && (
            <Link href={agent.linkTo} className="text-xs font-semibold ml-auto" style={{ color: '#0077C5' }}>
              {agent.linkLabel}
            </Link>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={state.status === 'loading'}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            agent.id === 'pipeline'
              ? 'btn-orange'
              : 'btn-primary'
          } disabled:opacity-50`}
        >
          {state.status === 'loading'
            ? <><Loader2 size={15} className="animate-spin" />Running…</>
            : <><Play size={14} />{agent.btnLabel}</>
          }
        </button>
      </div>

      {/* Output panel */}
      {(state.status === 'success' || state.status === 'error') && (
        <div className={`border-t px-5 py-3 ${statusBg} border`} style={{ borderColor: state.status === 'success' ? '#BBF7D0' : '#FECACA' }}>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold"
            style={{ color: state.status === 'success' ? '#166534' : '#991B1B' }}
          >
            <span className="flex items-center gap-1.5">
              {state.status === 'success'
                ? <><CheckCircle2 size={13} />Completed{state.durationMs ? ` in ${(state.durationMs / 1000).toFixed(1)}s` : ''}</>
                : <><XCircle size={13} />Error</>
              }
            </span>
            <div className="flex items-center gap-2">
              <span className="font-normal" style={{ color: state.status === 'success' ? '#4ADE80' : '#FCA5A5' }}>
                {state.lastRun ? new Date(state.lastRun).toLocaleTimeString() : ''}
              </span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {state.status === 'error' ? (
                <p className="text-xs text-red-600">{state.error}</p>
              ) : (
                <>
                  <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>{state.output}</p>
                  {state.outputDetails && Object.keys(state.outputDetails).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {Object.entries(state.outputDetails).map(([k, v]) => (
                        <div key={k} className="rounded-lg px-2.5 py-2 bg-white border border-green-100">
                          <div className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{k}</div>
                          <div className="text-xs font-bold mt-0.5" style={{ color: '#1E293B' }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Contract Change Simulator ─────────────────────────────────────────────── */

interface SimStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  detail: React.ReactNode;
  durationMs: number;
  type: 'detect' | 'warn' | 'remap' | 'validate' | 'log' | 'ok';
}

const SIM_STEPS: SimStep[] = [
  {
    id: 's1', type: 'detect', durationMs: 900,
    icon: <RefreshCw size={13} />,
    label: 'Polling ADP Payroll API — GET /v2/employees',
    detail: <span className="text-slate-500">Routine heartbeat check against <code className="bg-slate-100 px-1 rounded text-xs">adp.api.intuit.com/v2/employees</code></span>,
  },
  {
    id: 's2', type: 'warn', durationMs: 1100,
    icon: <FileWarning size={13} />,
    label: 'Schema drift detected on ADP Payroll response',
    detail: (
      <div className="space-y-1.5">
        <div className="text-xs text-amber-700 font-semibold">Expected contract field missing from response:</div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded line-through">employee_id</span>
          <ArrowRight size={12} className="text-slate-400 shrink-0" />
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">emp_id</span>
        </div>
        <div className="text-[11px] text-slate-500">Field renamed in ADP API v2.4 rollout — breaking change detected in adapter layer.</div>
      </div>
    ),
  },
  {
    id: 's3', type: 'remap', durationMs: 800,
    icon: <GitCompare size={13} />,
    label: 'Applying automatic field remapping in adapter',
    detail: (
      <div className="font-mono text-xs space-y-1">
        <div className="text-slate-500">// Atlas adapter: adp-payroll-mapper.ts</div>
        <div><span className="text-red-500 line-through">response.employee_id</span></div>
        <div><span className="text-green-600">response.emp_id ?? response.employee_id  </span><span className="text-slate-400">// fallback for v2.3</span></div>
      </div>
    ),
  },
  {
    id: 's4', type: 'validate', durationMs: 700,
    icon: <CheckCheck size={13} />,
    label: 'Validating remapped data against Atlas schema',
    detail: (
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-green-500" /><span>All 22 employee records resolved via <code className="bg-slate-100 px-1 rounded">emp_id</code></span></div>
        <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-green-500" /><span>Payroll totals reconciled — $0 delta vs prior snapshot</span></div>
        <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-green-500" /><span>No data gaps introduced; pipeline can proceed</span></div>
      </div>
    ),
  },
  {
    id: 's5', type: 'log', durationMs: 600,
    icon: <ClipboardList size={13} />,
    label: 'Contract change logged to Governance store',
    detail: (
      <div className="text-xs space-y-1 text-slate-500">
        <div><span className="font-semibold text-slate-700">Event:</span> API_CONTRACT_CHANGE</div>
        <div><span className="font-semibold text-slate-700">System:</span> ADP Payroll  ·  <span className="font-semibold text-slate-700">Field:</span> employee_id → emp_id</div>
        <div><span className="font-semibold text-slate-700">Resolution:</span> AUTO_REMAPPED  ·  <span className="font-semibold text-slate-700">Risk:</span> LOW</div>
        <div><span className="font-semibold text-slate-700">Action required:</span> Update adapter contract baseline in next deploy</div>
      </div>
    ),
  },
  {
    id: 's6', type: 'ok', durationMs: 500,
    icon: <CheckCircle2 size={13} />,
    label: 'Pipeline resumed — data contract self-healed',
    detail: <span className="text-green-700 text-xs">ADP Payroll data is available for the current session brief. No expert interruption required. Adapter contract flagged for baseline update.</span>,
  },
];

const STEP_COLORS = {
  detect:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'bg-blue-100 text-blue-600',  text: 'text-blue-800'   },
  warn:     { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'bg-amber-100 text-amber-700', text: 'text-amber-800'  },
  remap:    { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-700', text: 'text-purple-800' },
  validate: { bg: 'bg-teal-50',   border: 'border-teal-200',   icon: 'bg-teal-100 text-teal-700',  text: 'text-teal-800'   },
  log:      { bg: 'bg-slate-50',  border: 'border-slate-200',  icon: 'bg-slate-100 text-slate-600', text: 'text-slate-700'  },
  ok:       { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'bg-green-100 text-green-700', text: 'text-green-800'  },
};

function ContractChangeSimulator() {
  const [simState, setSimState] = useState<'idle' | 'running' | 'done'>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const cancelRef = useRef(false);

  const runSimulation = async () => {
    cancelRef.current = false;
    setSimState('running');
    setCurrentStep(-1);
    setCompletedSteps(new Set());

    for (let i = 0; i < SIM_STEPS.length; i++) {
      if (cancelRef.current) break;
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, SIM_STEPS[i].durationMs));
      if (cancelRef.current) break;
      setCompletedSteps(prev => new Set([...prev, i]));
    }

    if (!cancelRef.current) setSimState('done');
  };

  const reset = () => {
    cancelRef.current = true;
    setSimState('idle');
    setCurrentStep(-1);
    setCompletedSteps(new Set());
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50">
            <TriangleAlert size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#1E293B]">Data Contract Change — ADP Payroll API</span>
              <span className="badge-read flex-shrink-0">SIMULATION</span>
            </div>
            <div className="text-xs font-medium mt-0.5 text-[#94A3B8]">Orchestration Plane · Self-Healing Agent</div>
          </div>
        </div>

        <div className="px-3 py-2 rounded-lg mb-3 text-xs font-semibold bg-amber-50 text-amber-700">
          Simulate: ADP Payroll API v2.4 renames <code className="font-mono">employee_id</code> → <code className="font-mono">emp_id</code> — agent detects, remaps, and self-heals without interrupting Marcus
        </div>

        <p className="text-xs leading-relaxed text-[#64748B] mb-4">
          Watch the Self-Healing Agent detect a breaking field rename in the ADP Payroll API contract,
          automatically apply a compatibility remap in the adapter layer, validate data integrity,
          and log the contract drift — all before Marcus notices anything.
        </p>

        <div className="flex items-center gap-3">
          {simState !== 'running' && (
            <button
              onClick={runSimulation}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold btn-primary"
            >
              <Play size={14} />
              {simState === 'done' ? 'Run Again' : 'Run Simulation'}
            </button>
          )}
          {simState === 'running' && (
            <button
              onClick={reset}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <XCircle size={14} />
              Stop
            </button>
          )}
          {simState === 'done' && (
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Reset
            </button>
          )}
          <Link href="/governance" className="text-xs font-semibold ml-auto text-[#0077C5]">
            View Contract Log →
          </Link>
        </div>
      </div>

      {/* Step-by-step trace */}
      {simState !== 'idle' && (
        <div className="border-t border-[var(--border-color)]">
          <div className="px-5 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-slate-50 border-b border-[var(--border-color)]">
            Live Agent Trace — ADP Payroll Contract Heal
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {SIM_STEPS.map((step, i) => {
              const isActive = currentStep === i && !completedSteps.has(i);
              const isDone = completedSteps.has(i);
              const isPending = i > currentStep;
              const colors = STEP_COLORS[step.type];

              return (
                <div
                  key={step.id}
                  className={`px-5 py-3 transition-all ${isDone ? colors.bg : isActive ? 'bg-blue-50' : 'bg-white'} ${isPending ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isDone ? colors.icon :
                      isActive ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isActive
                        ? <Loader2 size={11} className="animate-spin" />
                        : isDone
                        ? step.icon
                        : <span className="text-[10px] font-bold">{i + 1}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${isDone ? colors.text : isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                        {step.label}
                      </div>
                      {(isDone || isActive) && (
                        <div className="mt-1.5">{step.detail}</div>
                      )}
                    </div>
                    {isDone && (
                      <CheckCircle2 size={13} className={`shrink-0 mt-0.5 ${step.type === 'warn' ? 'text-amber-500' : 'text-green-500'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {simState === 'done' && (
            <div className="px-5 py-4 bg-green-50 border-t border-green-200 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-green-800">Self-heal complete — 0 disruption to Marcus</div>
                <div className="text-xs text-green-600 mt-0.5">
                  ADP Payroll field remapped in ~{SIM_STEPS.reduce((s, st) => s + st.durationMs, 0) / 1000}s.
                  Contract drift logged. Atlas adapter flagged for baseline update in next CI deploy.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function AgentControlPanel() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(
    Object.fromEntries(
      AGENT_GROUPS.flatMap(g => g.agents).map(a => [a.id, { status: 'idle' }])
    )
  );

  const runAgent = async (agentId: string, runnerId: string) => {
    setAgentStates(prev => ({ ...prev, [agentId]: { status: 'loading' } }));
    const start = Date.now();
    try {
      const runner = RUNNERS[runnerId];
      if (!runner) throw new Error('No runner defined');
      const { summary, details } = await runner();
      setAgentStates(prev => ({
        ...prev,
        [agentId]: {
          status: 'success',
          lastRun: new Date().toISOString(),
          durationMs: Date.now() - start,
          output: summary,
          outputDetails: details,
        },
      }));
    } catch (e) {
      setAgentStates(prev => ({
        ...prev,
        [agentId]: {
          status: 'error',
          lastRun: new Date().toISOString(),
          error: String(e),
        },
      }));
    }
  };

  const runningCount = Object.values(agentStates).filter(s => s.status === 'loading').length;
  const successCount = Object.values(agentStates).filter(s => s.status === 'success').length;

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Agent Control Panel"
        subtitle="Trigger individual agents or run the full pipeline"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}>
            <div className={`w-2 h-2 rounded-full ${runningCount > 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
            {runningCount > 0 ? `${runningCount} agent${runningCount > 1 ? 's' : ''} running` : 'All agents idle'}
          </div>
          {successCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 size={13} />{successCount} completed this session
            </div>
          )}
          <div className="ml-auto">
            <Link href="/governance" className="text-xs font-semibold" style={{ color: '#0077C5' }}>
              View Governance Log →
            </Link>
          </div>
        </div>

        {/* Dependency flow — visual */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} style={{ color: '#0077C5' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Agent Execution Order</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: 'DAS', color: 'bg-blue-50 text-blue-700 border-blue-200', state: agentStates['das'] },
              null,
              { name: 'Summarizer', color: 'bg-green-50 text-green-700 border-green-200', state: agentStates['summarizer'] },
              { name: 'Policy Agent', color: 'bg-red-50 text-red-700 border-red-200', state: agentStates['policy'] },
              { name: 'Tax Classifier', color: 'bg-orange-50 text-orange-700 border-orange-200', state: agentStates['tax'] },
              null,
              { name: 'RAG Agent', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', state: agentStates['rag_contractor'] },
            ].map((item, i) =>
              item === null
                ? <ArrowRight key={i} size={14} className="text-slate-300 flex-shrink-0" />
                : (
                  <div key={item.name} className="flex items-center gap-1">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${item.color}`}>
                      {item.state.status === 'loading' && <Loader2 size={11} className="animate-spin" />}
                      {item.state.status === 'success' && <CheckCircle2 size={11} />}
                      {item.name}
                    </span>
                  </div>
                )
            )}
          </div>
          <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>
            DAS must complete first. Summarizer, Policy Agent, and Tax Classifier run in parallel. RAG Agent runs after Policy Agent surfaces findings.
          </p>
        </div>

        {/* Agent groups */}
        {AGENT_GROUPS.map(group => (
          <section key={group.label}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{group.label}</h2>
              <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
              <span className="text-xs font-semibold" style={{ color: '#CBD5E1' }}>{group.agents.length} agent{group.agents.length > 1 ? 's' : ''}</span>
            </div>
            <div className={`grid gap-4 ${
              group.agents.length === 1
                ? 'grid-cols-1 max-w-lg'
                : group.label === 'Data & Retrieval'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {group.agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  state={agentStates[agent.id]}
                  onRun={() => runAgent(agent.id, agent.runnerId)}
                />
              ))}
            </div>

            {/* Contract change simulation lives in Platform Health */}
            {group.label === 'Platform Health' && (
              <div className="mt-4">
                <ContractChangeSimulator />
              </div>
            )}
          </section>
        ))}

        {/* Governance hint */}
        <div className="card p-4 flex items-start gap-3" style={{ background: '#F8FAFC' }}>
          <ClipboardList size={16} style={{ color: '#94A3B8' }} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-semibold" style={{ color: '#475569' }}>Every agent run is logged.</span>
            <span className="text-sm ml-1" style={{ color: '#94A3B8' }}>All outputs are classified by risk level (READ / ADVISORY / ACTION) and written to the audit trail automatically.</span>
            <Link href="/governance" className="text-sm font-semibold ml-2" style={{ color: '#0077C5' }}>View Governance Log →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
