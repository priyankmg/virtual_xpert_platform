'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  TrendingUp, AlertTriangle, DollarSign, CheckCircle2,
  Play, Loader2, Database, ShieldCheck, Search,
  FileText, Calculator, ArrowUpRight, ExternalLink,
  Zap, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

const SOURCE_SYSTEMS = [
  'QuickBooks Online', 'ADP Payroll', 'Expensify',
  'Stripe', 'Inventory System', 'Prior Tax Returns',
];

interface PipelineResult {
  summary: {
    executiveSummary: string;
    attentionItems: { severity: string; description: string; source: string }[];
  };
  taxEstimate: {
    scenarios: {
      base: { totalLiability: number };
      conservative: { totalLiability: number };
      optimistic: { totalLiability: number };
    };
  };
  policyReport: { overallRiskLevel: string };
  totalDurationMs: number;
}

/* ── Quick action definitions ──────────────────────── */
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  linkTo: string;
  run: () => Promise<string>;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'das',
    label: 'Aggregate Financial Data',
    description: 'Pull all 6 source systems into a unified snapshot',
    icon: Database,
    iconBg: '#EFF6FF',
    iconColor: '#0077C5',
    linkTo: '/financial-snapshot',
    run: async () => {
      const res = await fetch('/api/das/snapshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'CLIENT-001' }),
      });
      const d = await res.json();
      return `Revenue: $${d.accounting.revenue.toLocaleString()} · Net Income: $${d.accounting.netIncome.toLocaleString()} · ${d.reconciliationFlags.length} flag(s)`;
    },
  },
  {
    id: 'compliance',
    label: 'Check IRS Compliance',
    description: 'Evaluate expenses, payroll & deductions against IRS rules',
    icon: ShieldCheck,
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    linkTo: '/policy-review',
    run: async () => {
      const snapRes = await fetch('/api/das/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'CLIENT-001' }) });
      const snap = await snapRes.json();
      const res = await fetch('/api/agents/policy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot: snap }) });
      const d = await res.json();
      return `${d.overallRiskLevel} overall risk · ${d.findings.filter((f: { riskLevel: string }) => f.riskLevel === 'HIGH').length} HIGH findings · $${d.deductionOpportunities.reduce((s: number, o: { estimatedValue: number }) => s + o.estimatedValue, 0).toLocaleString()} in deductions found`;
    },
  },
  {
    id: 'contractor',
    label: 'Find Contractor Precedents',
    description: 'Search IRS rulings on worker misclassification risk',
    icon: Search,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    linkTo: '/precedents',
    run: async () => {
      const res = await fetch('/api/agents/rag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'contractor misclassification employee 1099 payroll tax', clientId: 'CLIENT-001' }) });
      const d = await res.json();
      return `Found ${d.precedents.length} relevant cases · Top: "${d.precedents[0]?.title}" (${(d.precedents[0]?.relevanceScore * 100).toFixed(0)}% match)`;
    },
  },
  {
    id: 'summary',
    label: 'Generate Expert Summary',
    description: 'Create the pre-session brief for the Intuit expert',
    icon: FileText,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    linkTo: '/session-brief',
    run: async () => {
      const snapRes = await fetch('/api/das/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'CLIENT-001' }) });
      const snap = await snapRes.json();
      const res = await fetch('/api/agents/summarizer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot: snap, audienceType: 'expert' }) });
      const d = await res.json();
      return `${d.attentionItems?.filter((i: { severity: string }) => i.severity === 'HIGH').length ?? 0} HIGH items · Session ready: ${d.readyForExpertSession ? 'Yes' : 'No'}`;
    },
  },
  {
    id: 'tax',
    label: 'Estimate Tax Liability',
    description: 'Run 3-scenario federal + California tax model',
    icon: Calculator,
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    linkTo: '/tax-estimate',
    run: async () => {
      const snapRes = await fetch('/api/das/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'CLIENT-001' }) });
      const snap = await snapRes.json();
      const res = await fetch('/api/agents/tax-classifier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot: snap }) });
      const d = await res.json();
      return `Base: $${d.scenarios.base.totalLiability.toLocaleString()} · Conservative: $${d.scenarios.conservative.totalLiability.toLocaleString()} · Optimistic: $${d.scenarios.optimistic.totalLiability.toLocaleString()}`;
    },
  },
  {
    id: 'meals',
    label: 'Find Meals & Entertainment Cases',
    description: 'Search IRS rulings on IRC 274 and post-TCJA deductibility',
    icon: Search,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    linkTo: '/precedents',
    run: async () => {
      const res = await fetch('/api/agents/rag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'meals entertainment 274 TCJA business purpose 50% deductible', clientId: 'CLIENT-001' }) });
      const d = await res.json();
      return `Found ${d.precedents.length} relevant cases · Confidence: ${(d.confidenceInRelevance * 100).toFixed(0)}%`;
    },
  },
];

/* ── Quick Action Card ─────────────────────────────── */
function QuickActionCard({ action }: { action: QuickAction }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  const run = async () => {
    setStatus('loading');
    setResult('');
    try {
      const out = await action.run();
      setResult(out);
      setStatus('done');
    } catch {
      setResult('Agent call failed. Check your API key configuration.');
      setStatus('error');
    }
  };

  const Icon = action.icon;

  return (
    <div className={`card p-4 flex flex-col gap-3 transition-all ${status === 'loading' ? 'shadow-md' : 'hover:shadow-md hover:border-slate-300'}`}>
      {/* Icon + label */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: action.iconBg }}>
          <Icon size={17} style={{ color: action.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: '#1E293B' }}>{action.label}</div>
          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: '#94A3B8' }}>{action.description}</div>
        </div>
      </div>

      {/* Result */}
      {status === 'done' && (
        <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={11} className="inline mr-1.5 mb-0.5" />
          {result}
        </div>
      )}
      {status === 'error' && (
        <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
          {result}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={status === 'loading'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: action.iconBg, color: action.iconColor, border: `1px solid ${action.iconBg}` }}
        >
          {status === 'loading'
            ? <><Loader2 size={12} className="animate-spin" />Running…</>
            : <><Play size={12} />Run</>
          }
        </button>
        {status === 'done' && (
          <Link
            href={action.linkTo}
            className="flex items-center gap-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#EFF6FF', color: '#0077C5', border: '1px solid #BAE0F7' }}
          >
            View <ArrowUpRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function Dashboard() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [step, setStep] = useState('');
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);

  const runPipeline = async () => {
    setRunning(true);
    setResult(null);
    const steps = [
      'Connecting to 6 source systems…',
      'Aggregating financial data (DAS)…',
      'Running Summarizer Agent…',
      'Running Policy Evaluation Agent…',
      'Querying IRS Precedent Library…',
      'Estimating tax liability…',
      'Assembling session brief…',
    ];
    for (const s of steps) {
      setStep(s);
      await new Promise(r => setTimeout(r, 400));
    }
    try {
      const res = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'CLIENT-001' }),
      });
      setResult(await res.json());
    } catch { /* no-op */ }
    setStep('');
    setRunning(false);
  };

  const attentionItems = result?.summary.attentionItems ?? [
    { severity: 'HIGH', description: 'Revenue reconciliation gap: Stripe vs. QuickBooks ($148K delta)', source: 'Stripe / QuickBooks' },
    { severity: 'HIGH', description: '4 contractors ($184K) — worker misclassification risk', source: 'ADP Payroll' },
    { severity: 'HIGH', description: '$18K entertainment — likely 100% non-deductible post-TCJA', source: 'Expensify' },
    { severity: 'MEDIUM', description: '$22K home office claims — exclusive use documentation required', source: 'Expensify' },
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Atlas Dashboard"
        subtitle="Q4 Tax Readiness · Meridian Home Goods"
        action={
          <button onClick={runPipeline} disabled={running} className="btn-orange whitespace-nowrap">
            {running ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {running ? 'Running…' : 'Run Full Pipeline'}
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Pipeline progress */}
        {running && (
          <div className="card p-4 flex items-center gap-3 border-blue-200" style={{ background: '#EFF6FF' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ background: '#DBEAFE' }}>
              <Zap size={16} style={{ color: '#2563EB' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: '#1E3A8A' }}>Pipeline Running</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: '#3B82F6' }}>{step}</div>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Pipeline result */}
        {result && (
          <div className="card p-5 border-green-200" style={{ background: '#F0FDF4' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold" style={{ color: '#166534' }}>Session Brief Ready</div>
                  <div className="text-sm" style={{ color: '#4ADE80' }}>
                    Pipeline completed in {(result.totalDurationMs / 1000).toFixed(1)}s · {result.summary.attentionItems.length} attention items
                  </div>
                </div>
              </div>
              <Link href="/session-brief" className="btn-primary self-start sm:self-auto">
                View Session Brief <ArrowUpRight size={14} />
              </Link>
            </div>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: '#166534' }}>{result.summary.executiveSummary}</p>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenue YTD', value: '$12,400,000', delta: '+15.3% vs. prior year', icon: TrendingUp, accent: '#16A34A', accentBg: '#F0FDF4' },
            { label: 'Net Income', value: '$1,870,000', delta: '15.1% net margin', icon: DollarSign, accent: '#0077C5', accentBg: '#EFF6FF' },
            {
              label: 'Est. Tax Liability',
              value: result ? `$${result.taxEstimate.scenarios.base.totalLiability.toLocaleString()}` : '$580K–$680K',
              delta: 'Requires expert review',
              icon: Calculator, accent: '#EA580C', accentBg: '#FFF7ED',
            },
            {
              label: 'Open Action Items',
              value: String(attentionItems.filter(a => a.severity === 'HIGH').length),
              delta: 'HIGH severity',
              icon: AlertTriangle, accent: '#DC2626', accentBg: '#FEF2F2',
            },
          ].map(({ label, value, delta, icon: Icon, accent, accentBg }) => (
            <div key={label} className="metric-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
                  <Icon size={15} style={{ color: accent }} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: '#1E293B' }}>{value}</div>
              <div className="text-xs mt-1 font-semibold" style={{ color: accent }}>{delta}</div>
            </div>
          ))}
        </div>

        {/* ── Quick Agent Actions ─────────────────────────── */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setQuickActionsExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Zap size={15} style={{ color: '#0077C5' }} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold" style={{ color: '#1E293B' }}>Quick Agent Actions</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Trigger individual agents for specific use cases</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#EFF6FF', color: '#0077C5' }}>6 agents</span>
              {quickActionsExpanded ? <ChevronUp size={16} style={{ color: '#94A3B8' }} /> : <ChevronDown size={16} style={{ color: '#94A3B8' }} />}
            </div>
          </button>

          {quickActionsExpanded && (
            <div className="border-t border-slate-100">
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map(action => (
                  <QuickActionCard key={action.id} action={action} />
                ))}
              </div>
              <div className="px-5 pb-4">
                <Link href="/agents" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border border-slate-200 hover:border-blue-300 hover:bg-blue-50" style={{ color: '#0077C5' }}>
                  <RefreshCw size={14} />
                  Open Agent Control Panel
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Systems */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={15} style={{ color: '#0077C5' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Source Systems</h3>
              </div>
              <span className="badge-low">6 / 6 Connected</span>
            </div>
            <div className="divide-y divide-slate-100">
              {SOURCE_SYSTEMS.map(sys => (
                <div key={sys} className="flex items-center justify-between py-2.5">
                  <span className="text-sm" style={{ color: '#475569' }}>{sys}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-green-600">Connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attention Items */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: '#EA580C' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Attention Items</h3>
              </div>
              <Link href="/session-brief" className="text-xs font-bold" style={{ color: '#0077C5' }}>View all →</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {attentionItems.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className={`flex-shrink-0 ${item.severity === 'HIGH' ? 'badge-high' : item.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                    {item.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{item.description}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: '#94A3B8' }}>{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick navigation */}
        <div>
          <div className="section-title mb-3">Quick Navigation</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Financial Snapshot', icon: Database, href: '/financial-snapshot', desc: '6 systems aggregated' },
              { label: 'Policy Review', icon: ShieldCheck, href: '/policy-review', desc: 'HIGH overall risk' },
              { label: 'IRS Precedents', icon: FileText, href: '/precedents', desc: '8 relevant cases' },
              { label: 'Tax Estimate', icon: Calculator, href: '/tax-estimate', desc: '3-scenario model' },
            ].map(({ label, icon: Icon, href, desc }) => (
              <Link
                key={href}
                href={href}
                className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: '#EFF6FF' }}>
                  <Icon size={17} style={{ color: '#0077C5' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#1E293B' }}>{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{desc}</div>
                </div>
                <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: '#0077C5' }} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
