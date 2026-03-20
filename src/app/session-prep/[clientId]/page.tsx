'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Play, CheckCircle2, Loader2, Sparkles, AlertTriangle,
  ChevronDown, ChevronUp, ChevronRight, Bot, Send, User,
  BookOpen, TrendingUp, ShieldCheck,
  Check, Info, ExternalLink,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { todaySessions, clientHistory } from '@/data/mock/expert-sessions';
import { useSelectedClient } from '@/components/layout/AppShell';

// ── Prep steps simulation ────────────────────────────────────────────────────
const PREP_STEPS = [
  { id: 'connect', label: 'Connecting to 6 source systems', duration: 600 },
  { id: 'qb', label: 'Pulling QuickBooks Online — P&L, balance sheet, transactions', duration: 700 },
  { id: 'adp', label: 'Fetching ADP Payroll register & tax filings', duration: 600 },
  { id: 'expensify', label: 'Loading Expensify expense reports (flagged: $42K)', duration: 500 },
  { id: 'stripe', label: 'Aggregating Stripe revenue data — $12.4M YTD', duration: 500 },
  { id: 'inventory', label: 'Reading inventory system — Q3 ending value $1.1M', duration: 400 },
  { id: 'tax', label: 'Retrieving prior year TurboTax Business returns', duration: 600 },
  { id: 'reconcile', label: 'Reconciling cross-system data — 3 flags found', duration: 800 },
  { id: 'summarize', label: 'Running AI Summarizer Agent (claude-opus-4-5)', duration: 1200 },
  { id: 'policy', label: 'Running Policy Evaluation Agent — checking IRS rules', duration: 1000 },
  { id: 'rag', label: 'Retrieving relevant IRS Tax Court precedents', duration: 700 },
  { id: 'tax_classify', label: 'Generating 3-scenario tax estimate', duration: 900 },
  { id: 'governance', label: 'Classifying actions — 3 require expert confirmation', duration: 500 },
];

// ── Mock brief output ────────────────────────────────────────────────────────
const MOCK_SUMMARY = {
  executive: `Meridian Home Goods is entering Q4 2025 in a strong financial position — net income YTD of $1.87M represents a 12% increase over prior year, driven by revenue growth to $12.4M. However, three material risks require expert attention before year-end: (1) potential contractor misclassification of 2 workers with estimated FICA exposure of $38K–$54K, (2) $42K in Expensify expenses with ambiguous business-personal purpose that may be disallowed in audit, and (3) a Q4 estimated tax payment of approximately $78,400 due January 15.`,
  keyMetrics: [
    { label: 'Net Income YTD', value: '$1,870,000', trend: '+12%', flag: false },
    { label: 'Annual Revenue', value: '$12,400,000', trend: '+18%', flag: false },
    { label: 'Total Payroll', value: '$3,200,000', trend: null, flag: false },
    { label: 'Flagged Expenses', value: '$42,000', trend: null, flag: true },
    { label: 'Est. Q4 Tax Due', value: '$78,400', trend: null, flag: true },
    { label: 'Contractor Risk', value: '$38K–$54K', trend: null, flag: true },
  ],
  policyFindings: [
    {
      id: 'pf-001',
      risk: 'HIGH',
      title: 'Contractor Misclassification Risk',
      description: '2 of 7 contractors fail the behavioral and economic control tests under IRC §3401. IRS precedent TC-2019-0124 resulted in $180K assessment for similar S-Corp.',
      recommendation: 'Reclassify as W-2 employees in ADP before year-end. File corrected 941s if needed.',
      requiresApproval: true,
      precedent: 'TC-2019-0124',
    },
    {
      id: 'pf-002',
      risk: 'HIGH',
      title: 'Flagged Expensify Expenses — $42K',
      description: '$42,000 in expense reports lack sufficient business purpose documentation. Risk of full disallowance under IRC §274 if audited.',
      recommendation: 'Request receipts and business purpose documentation for all flagged items before filing.',
      requiresApproval: true,
      precedent: 'TC-2018-0156',
    },
    {
      id: 'pf-003',
      risk: 'MEDIUM',
      title: 'S-Corp Reasonable Compensation Review',
      description: "Owner salary of $95K is within acceptable range per QuickBooks Live benchmarks, but should be documented annually. IRS scrutinizes S-Corp distributions.",
      recommendation: 'Maintain written compensation policy and document rationale for current salary level.',
      requiresApproval: false,
      precedent: 'TC-2021-0087',
    },
    {
      id: 'pf-004',
      risk: 'LOW',
      title: 'Section 179 Opportunity — Delivery Van ($38K)',
      description: 'Delivery van purchased Q3 2025 qualifies for full Section 179 expensing, reducing taxable income by $38,000.',
      recommendation: 'Elect Section 179 on Form 4562. Client must confirm asset is used >50% for business.',
      requiresApproval: true,
      precedent: null,
    },
  ],
  taxEstimate: {
    conservative: 312400,
    base: 287600,
    optimistic: 241800,
    q4Payment: 78400,
    priorYearEffectiveRate: '21.3%',
  },
};

// ── Chat panel ────────────────────────────────────────────────────────────────
interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

function AssistantPanel({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'init',
    role: 'assistant',
    content: "Session brief is ready. Ask me anything about this client's financial situation before you start.",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
    setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, clientId }),
      });
      const data = await res.json();
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'Based on the session brief, I can see several items worth discussing. The contractor misclassification risk is the highest priority — two workers fail the control test and retroactive FICA exposure could be $38K–$54K.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Based on the pre-session brief: the highest priority item is contractor misclassification risk ($38K–$54K exposure) followed by the $42K in undocumented Expensify expenses. Recommend addressing both in today's session.",
        timestamp: new Date(),
      }]);
    } finally { setLoading(false); }
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all ${open ? 'w-80 sm:w-96' : 'w-auto'}`}>
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden mb-3" style={{ height: '420px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--intuit-blue)]">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-white" />
              <span className="text-sm font-semibold text-white">Intuit Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white transition-colors text-xs">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--intuit-blue)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--intuit-blue)] text-white rounded-tr-sm'
                    : 'bg-white border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm shadow-sm'
                }`}>{m.content}</div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={11} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--intuit-blue)] flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-white border border-[var(--border-color)] rounded-xl px-3 py-2 shadow-sm">
                  <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="p-2 border-t border-[var(--border-color)] bg-white flex gap-1.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about this client…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--intuit-blue)] bg-slate-50"
            />
            <button type="submit" disabled={!input.trim() || loading}
              className="px-3 py-1.5 rounded-lg bg-[var(--intuit-blue)] text-white disabled:opacity-50 hover:bg-[var(--intuit-blue-dark)] transition-colors">
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="self-end flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--intuit-blue)] text-white shadow-lg hover:bg-[var(--intuit-blue-dark)] transition-all"
      >
        <Sparkles size={16} />
        <span className="text-sm font-semibold">Intuit Assistant</span>
        {!open && messages.length > 1 && (
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{messages.length - 1}</span>
        )}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type PrepPhase = 'idle' | 'running' | 'done';

export default function SessionPrepPage() {
  const params = useParams();
  const router = useRouter();
  const { setSelectedClient } = useSelectedClient();
  const clientId = params.clientId as string;
  const session = todaySessions.find(s => s.clientId === clientId);
  const history = clientHistory[clientId];

  const [phase, setPhase] = useState<PrepPhase>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [briefConfirmed, setBriefConfirmed] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Set context when page loads
  useEffect(() => {
    if (session) {
      setSelectedClient({
        clientId: session.clientId,
        clientName: session.clientName,
        entityType: session.entityType,
        sessionId: session.sessionId,
        sessionTopic: session.topic,
        briefStatus: phase === 'done' ? 'BRIEF_COMPLETE' : session.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
      });
    }
  }, [session, phase, setSelectedClient]);

  async function runPrep() {
    setPhase('running');
    setCurrentStep(0);
    setCompletedSteps(new Set());

    for (let i = 0; i < PREP_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, PREP_STEPS[i].duration));
      setCompletedSteps(prev => new Set([...prev, PREP_STEPS[i].id]));
    }

    // Fire actual API in background
    fetch('/api/agents/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    }).catch(() => {});

    setPhase('done');
  }

  function confirmReady() {
    setBriefConfirmed(true);
    if (session) {
      setSelectedClient({
        clientId: session.clientId,
        clientName: session.clientName,
        entityType: session.entityType,
        sessionId: session.sessionId,
        sessionTopic: session.topic,
        briefStatus: 'BRIEF_COMPLETE',
      });
    }
  }

  const lastSession = history?.communications[0];

  return (
    <>
      <Header
        title={session ? `Session Prep — ${session.clientName}` : 'Session Prep'}
        subtitle={session ? `${session.scheduledTime} · ${session.entityType} · ${session.topic}` : ''}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full pb-32">
        {/* Back + client header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--intuit-blue)] transition-colors">
            <ArrowLeft size={15} />
            Work Queue
          </Link>
          {session && (
            <>
              <span className="text-[var(--border-strong)]">/</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{session.clientName}</span>
            </>
          )}
        </div>

        {/* ── History of communication ── */}
        {history && (
          <div className="card mb-6 overflow-hidden">
            <button
              onClick={() => setHistoryExpanded(v => !v)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <BookOpen size={15} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Communication History — {history.clientName}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {history.communications.length} previous sessions · {history.openActionItems.length} open action items
                  </div>
                </div>
              </div>
              {historyExpanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
            </button>

            {/* Last session summary — always visible */}
            {lastSession && (
              <div className="px-5 pb-4 border-t border-[var(--border-color)]">
                <div className="pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Last Session</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{lastSession.date}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{lastSession.summary}</p>
                </div>

                {/* Open action items — always visible */}
                {history.openActionItems.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={13} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">Open Action Items from Prior Sessions</span>
                    </div>
                    <ul className="space-y-1.5">
                      {history.openActionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Full history — expanded */}
            {historyExpanded && (
              <div className="border-t border-[var(--border-color)]">
                <div className="p-5">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Full Communication Log</div>
                  <div className="space-y-6">
                    {history.communications.map((comm, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-slate-200">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[var(--intuit-blue)] border-2 border-white" />
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{comm.date}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{comm.type}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">{comm.summary}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="font-medium text-[var(--text-secondary)] mb-1">Topics Discussed</div>
                            <ul className="space-y-1">
                              {comm.topicsDiscussed.map((t, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[var(--text-muted)]">
                                  <span className="text-[var(--intuit-blue)] shrink-0">·</span>{t}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-secondary)] mb-1">Next Steps Agreed</div>
                            <ul className="space-y-1">
                              {comm.nextSteps.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[var(--text-muted)]">
                                  <span className="text-amber-500 shrink-0">→</span>{s}
                                </li>
                              ))}
                            </ul>
                            {comm.completedItems && comm.completedItems.length > 0 && (
                              <div className="mt-2">
                                <div className="font-medium text-[var(--text-secondary)] mb-1">Completed</div>
                                <ul className="space-y-1">
                                  {comm.completedItems.map((s, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-green-600">
                                      <Check size={11} className="shrink-0 mt-0.5" />{s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {history.keyContext && (
                    <div className="mt-6 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-blue-800 mb-1">Client Context Note</div>
                          <p className="text-xs text-blue-700">{history.keyContext}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE: idle — Prepare button ── */}
        {phase === 'idle' && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--intuit-blue-light)] flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-[var(--intuit-blue)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Prepare for Session</h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-2">
              Atlas will aggregate data from all 6 connected source systems and run the full AI agent pipeline to generate your session brief.
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
              Estimated time: ~15 seconds · Covers financial summary, policy review, IRS precedents, and 3-scenario tax estimate
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['QuickBooks', 'ADP Payroll', 'Expensify', 'Stripe', 'Inventory', 'Tax Returns'].map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] bg-slate-50">{s}</span>
              ))}
            </div>
            <button
              onClick={runPrep}
              className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[var(--intuit-blue)] text-white font-semibold text-base hover:bg-[var(--intuit-blue-dark)] transition-all shadow-md hover:shadow-lg"
            >
              <Play size={18} />
              Prepare for Session
            </button>
          </div>
        )}

        {/* ── PHASE: running — real-time steps ── */}
        {phase === 'running' && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[var(--intuit-blue-light)] flex items-center justify-center">
                <Loader2 size={16} className="text-[var(--intuit-blue)] animate-spin" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Running AI Agent Pipeline…</div>
                <div className="text-xs text-[var(--text-muted)]">{completedSteps.size} of {PREP_STEPS.length} steps complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[var(--intuit-blue)] rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.size / PREP_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {PREP_STEPS.map((step, i) => {
                const done = completedSteps.has(step.id);
                const active = i === currentStep && !done;
                const isAI = step.id === 'summarize' || step.id === 'policy' || step.id === 'rag' || step.id === 'tax_classify' || step.id === 'governance';
                return (
                  <div key={step.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${
                    active ? 'bg-[var(--intuit-blue-light)]' :
                    done ? 'opacity-70' : 'opacity-30'
                  }`}>
                    <div className="shrink-0">
                      {done ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : active ? (
                        <Loader2 size={16} className="text-[var(--intuit-blue)] animate-spin" />
                      ) : (
                        <Circle size={16} className="text-slate-300" />
                      )}
                    </div>
                    <span className={`text-sm ${active ? 'font-medium text-[var(--intuit-blue)]' : done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
                      {step.label}
                    </span>
                    {isAI && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 shrink-0">AI</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PHASE: done — full brief ── */}
        {phase === 'done' && (
          <div className="space-y-6">

            {/* AI Summary banner */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3">
              <Bot size={18} className="text-purple-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-purple-800">AI-Generated Session Brief</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">claude-opus-4-5</span>
                  <span className="text-xs text-purple-600">· Generated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-purple-700">This brief was generated by Atlas AI agents from live source system data. All recommendations require expert review before being shared with the client. Confidence scores are shown per finding.</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--intuit-orange)]" />
                Executive Summary
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{MOCK_SUMMARY.executive}</p>
            </div>

            {/* Key Metrics */}
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--intuit-blue)]" />
                Key Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOCK_SUMMARY.keyMetrics.map(m => (
                  <div key={m.label} className={`p-3 rounded-lg border ${m.flag ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-lg font-bold ${m.flag ? 'text-red-700' : 'text-[var(--text-primary)]'}`}>{m.value}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{m.label}</div>
                    {m.trend && <div className="text-xs text-green-600 font-medium mt-1">{m.trend} vs prior year</div>}
                    {m.flag && <div className="flex items-center gap-1 mt-1"><AlertTriangle size={10} className="text-red-500" /><span className="text-xs text-red-600">Requires attention</span></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Findings */}
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--intuit-blue)]" />
                Policy Findings & Compliance
              </h3>
              <div className="space-y-3">
                {MOCK_SUMMARY.policyFindings.map(f => {
                  const expanded = expandedFinding === f.id;
                  return (
                    <div key={f.id} className={`border rounded-xl overflow-hidden transition-all ${
                      f.risk === 'HIGH' ? 'border-red-200' :
                      f.risk === 'MEDIUM' ? 'border-amber-200' : 'border-green-200'
                    }`}>
                      <button
                        onClick={() => setExpandedFinding(expanded ? null : f.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold border ${
                          f.risk === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                          f.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-green-100 text-green-700 border-green-200'
                        }`}>{f.risk}</span>
                        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{f.title}</span>
                        {f.requiresApproval && (
                          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">Needs Approval</span>
                        )}
                        {expanded ? <ChevronUp size={15} className="text-[var(--text-muted)] shrink-0" /> : <ChevronDown size={15} className="text-[var(--text-muted)] shrink-0" />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 border-t border-[var(--border-color)] pt-3 space-y-3">
                          <p className="text-sm text-[var(--text-secondary)]">{f.description}</p>
                          <div className="p-3 rounded-lg bg-[var(--intuit-blue-light)] border border-blue-200">
                            <div className="text-xs font-semibold text-[var(--intuit-blue)] mb-1">Recommendation</div>
                            <p className="text-sm text-[var(--text-primary)]">{f.recommendation}</p>
                          </div>
                          {f.precedent && (
                            <div className="flex items-center gap-2">
                              <BookOpen size={13} className="text-[var(--text-muted)]" />
                              <span className="text-xs text-[var(--text-muted)]">Precedent:</span>
                              <Link href="/precedents" className="text-xs font-medium text-[var(--intuit-blue)] hover:underline flex items-center gap-1">
                                {f.precedent} <ExternalLink size={10} />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tax Estimate */}
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--intuit-blue)]" />
                3-Scenario Tax Estimate
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Conservative', value: MOCK_SUMMARY.taxEstimate.conservative, color: 'bg-red-50 border-red-200', text: 'text-red-700', desc: 'All flagged deductions disallowed' },
                  { label: 'Base Case', value: MOCK_SUMMARY.taxEstimate.base, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', desc: 'Standard deductions applied' },
                  { label: 'Optimistic', value: MOCK_SUMMARY.taxEstimate.optimistic, color: 'bg-green-50 border-green-200', text: 'text-green-700', desc: 'All deductions realized' },
                ].map(s => (
                  <div key={s.label} className={`p-4 rounded-xl border ${s.color} text-center`}>
                    <div className={`text-xl font-bold ${s.text}`}>${s.value.toLocaleString()}</div>
                    <div className="text-sm font-medium text-[var(--text-primary)] mt-1">{s.label}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span className="text-sm text-amber-700">
                  <strong>Q4 estimated payment due Jan 15:</strong> ${MOCK_SUMMARY.taxEstimate.q4Payment.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-3 italic">This estimate is for planning purposes only and does not constitute tax advice. Prior year effective rate: {MOCK_SUMMARY.taxEstimate.priorYearEffectiveRate}.</p>
              <Link href="/tax-estimate" className="inline-flex items-center gap-1 text-sm text-[var(--intuit-blue)] hover:underline mt-2">
                View full 3-scenario model <ExternalLink size={12} />
              </Link>
            </div>

            {/* Confirm Ready */}
            {!briefConfirmed ? (
              <div className="card p-6 bg-[var(--intuit-blue-light)] border-[var(--intuit-blue)] border-2">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ready to start the session?</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      By confirming, you acknowledge you&apos;ve reviewed the AI-generated brief and are prepared to deliver expert advice. The session status will update to <strong>Brief Complete</strong> on your work queue.
                    </p>
                  </div>
                  <button
                    onClick={confirmReady}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--intuit-blue)] text-white font-semibold hover:bg-[var(--intuit-blue-dark)] transition-all shadow-md"
                  >
                    <Check size={16} />
                    Confirm — I&apos;m Ready
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6 bg-emerald-50 border-2 border-emerald-300">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-emerald-800">Pre-Brief Complete</div>
                      <div className="text-sm text-emerald-600">Session status updated. You&apos;re ready for {session?.clientName}.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-50 border border-[var(--border-color)] transition-colors">
                      <ArrowLeft size={13} />
                      Work Queue
                    </Link>
                    <Link
                      href={`/session-live/${clientId}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Start Session <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Floating Assistant */}
      <AssistantPanel clientId={clientId} />
    </>
  );
}

// Local import needed
function Circle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx={12} cy={12} r={10} />
    </svg>
  );
}
