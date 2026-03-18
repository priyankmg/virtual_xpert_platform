'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Send, Loader2, CheckCircle2, AlertTriangle, ChevronRight,
  ShieldCheck, BookOpen, TrendingUp, Zap, MessageSquare,
  BarChart3, User, Bot, ArrowLeft, RefreshCw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { todaySessions } from '@/data/mock/expert-sessions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentRouted?: string;
  precedents?: { title: string; year: number; outcome: string }[];
  requiresReview?: boolean;
}

interface LiveMetric {
  label: string;
  value: string;
  sub?: string;
  flag?: boolean;
}

const STARTER_QUESTIONS = [
  'What is her biggest tax risk this quarter?',
  'Is her home office deductible given the lease structure?',
  'Are there any payroll compliance gaps I should flag?',
  'Summarize the Q4 estimated tax situation',
  'Which contractor payments are misclassification risks?',
];

const LIVE_METRICS: LiveMetric[] = [
  { label: 'Net Income YTD', value: '$1,870,000', sub: '+12% vs prior year' },
  { label: 'Est. Q4 Tax Liability', value: '$312,400', sub: 'Base scenario', flag: false },
  { label: 'Flagged Expenses', value: '$42,000', sub: '3 items need review', flag: true },
  { label: 'Payroll Compliance', value: '2 Gaps', sub: '941 late + contractor risk', flag: true },
];

const GOVERNANCE_ACTIONS = [
  {
    id: 'gov-001',
    action: 'Recommend Section 179 election on delivery van ($38K)',
    riskLevel: 'ACTION',
    confidence: 0.87,
    agent: 'Policy Evaluation Agent',
    status: 'PENDING',
  },
  {
    id: 'gov-002',
    action: 'Flag contractor misclassification risk — TC-2019-0124 precedent',
    riskLevel: 'ACTION',
    confidence: 0.91,
    agent: 'RAG Agent',
    status: 'PENDING',
  },
  {
    id: 'gov-003',
    action: 'Estimated Q4 tax liability: $312,400 (base scenario)',
    riskLevel: 'ADVISORY',
    confidence: 0.79,
    agent: 'Tax Classifier',
    status: 'APPROVED',
  },
];

export default function SessionLivePage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const session = todaySessions.find(s => s.clientId === clientId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Session brief is loaded for **${session?.clientName || 'this client'}**. I&apos;ve run the full agent pipeline — DAS snapshot, policy evaluation, IRS precedent retrieval, and tax estimate are all ready.\n\nAsk me anything about Sarah&apos;s financial situation, or use the quick questions below to get started.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [governanceItems, setGovernanceItems] = useState(GOVERNANCE_ACTIONS);
  const [activeTab, setActiveTab] = useState<'assistant' | 'governance' | 'precedents'>('assistant');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, clientId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'I analyzed the data and prepared a response, but encountered an issue formatting it. Please check the Session Brief for full details.',
        timestamp: new Date(),
        agentRouted: data.agentRouted,
        requiresReview: data.requiresExpertReview,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Unable to reach the Intuit Assistant. Based on the pre-session brief: Sarah\'s biggest Q4 risk is contractor misclassification ($180K potential assessment per TC-2019-0124) followed by the $42K in flagged Expensify expenses. Recommend addressing both before year-end.',
        timestamp: new Date(),
        requiresReview: false,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleGovAction(id: string, action: 'approve' | 'reject') {
    setGovernanceItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
          : item
      )
    );
    fetch('/api/governance/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: id, approved: action === 'approve' }),
    }).catch(() => {});
  }

  const pendingCount = governanceItems.filter(g => g.status === 'PENDING').length;

  return (
    <>
      <Header
        title=""
        action={
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live Session</span>
            <span className="text-sm text-[var(--text-muted)] font-mono">{formatTime(sessionTime)}</span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-h-[calc(100vh-64px)]">

        {/* Left: Client Context */}
        <aside className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-white shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[var(--border-color)]">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--intuit-blue)] mb-3">
              <ArrowLeft size={12} />
              Back to queue
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold shrink-0">
                SC
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{session?.clientName || 'Meridian Home Goods'}</div>
                <div className="text-xs text-[var(--text-muted)]">{session?.entityType} · {session?.topic}</div>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Live Metrics</div>
            <div className="space-y-3">
              {LIVE_METRICS.map(m => (
                <div key={m.label} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {m.flag && <AlertTriangle size={11} className="text-amber-500 shrink-0" />}
                      <span className="text-xs text-[var(--text-secondary)] truncate">{m.label}</span>
                    </div>
                    {m.sub && <div className="text-xs text-[var(--text-muted)] truncate">{m.sub}</div>}
                  </div>
                  <div className={`text-sm font-semibold shrink-0 ${m.flag ? 'text-amber-600' : 'text-[var(--text-primary)]'}`}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Session Resources</div>
            <div className="space-y-1">
              {[
                { href: '/session-brief', icon: <ShieldCheck size={14} />, label: 'Session Brief' },
                { href: '/policy-review', icon: <BookOpen size={14} />, label: 'Policy Findings' },
                { href: '/precedents', icon: <BarChart3 size={14} />, label: 'IRS Precedents' },
                { href: '/tax-estimate', icon: <TrendingUp size={14} />, label: 'Tax Estimate' },
                { href: '/governance', icon: <ShieldCheck size={14} />, label: 'Governance Log' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--intuit-blue)] transition-colors group"
                >
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--intuit-blue)] transition-colors">{link.icon}</span>
                  {link.label}
                  <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab Bar */}
          <div className="flex border-b border-[var(--border-color)] bg-white shrink-0">
            {[
              { id: 'assistant' as const, label: 'Intuit Assistant', icon: <Zap size={14} /> },
              { id: 'governance' as const, label: `Governance${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <ShieldCheck size={14} /> },
              { id: 'precedents' as const, label: 'Precedents', icon: <BookOpen size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--intuit-blue)] text-[var(--intuit-blue)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'governance' && pendingCount > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'assistant' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[var(--intuit-blue)] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={14} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-xl ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[var(--intuit-blue)] text-white rounded-tr-sm'
                          : 'bg-white border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*/g, '')}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-xs text-[var(--text-muted)]">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.agentRouted && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            via {msg.agentRouted}
                          </span>
                        )}
                        {msg.requiresReview && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Requires review
                          </span>
                        )}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--intuit-blue)] flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-white border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                        <Loader2 size={13} className="animate-spin" />
                        Analyzing with AI agents…
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick starters */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="flex gap-2 flex-wrap">
                    {STARTER_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-[var(--intuit-blue-light)] text-[var(--intuit-blue)] border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-[var(--border-color)] bg-white shrink-0">
                <form
                  onSubmit={e => { e.preventDefault(); sendMessage(input); }}
                  className="flex gap-2"
                >
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mr-1">
                    <MessageSquare size={12} />
                  </div>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about Sarah's tax situation, compliance issues, deductions…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-slate-50 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--intuit-blue)] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--intuit-blue)] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--intuit-blue-dark)] transition-colors"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">Action Items — Expert Approval Required</h3>
                  <button onClick={() => {}} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--intuit-blue)]">
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
                {governanceItems.map(item => (
                  <div key={item.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            item.riskLevel === 'ACTION'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {item.riskLevel}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{item.agent}</span>
                          <span className="text-xs text-[var(--text-muted)]">·</span>
                          <span className="text-xs text-[var(--text-muted)]">{Math.round(item.confidence * 100)}% confidence</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">{item.action}</p>
                      </div>
                      {item.status === 'APPROVED' && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 size={11} />
                          Approved
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                          Rejected
                        </span>
                      )}
                    </div>
                    {item.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGovAction(item.id, 'approve')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle2 size={13} />
                          Approve &amp; Surface to Client
                        </button>
                        <button
                          onClick={() => handleGovAction(item.id, 'reject')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Link href="/governance" className="text-sm text-[var(--intuit-blue)] hover:underline flex items-center justify-center gap-1">
                    View full governance log <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'precedents' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--text-primary)]">Relevant IRS Precedents</h3>
                  <Link href="/precedents" className="text-sm text-[var(--intuit-blue)] hover:underline flex items-center gap-1">
                    Full library <ChevronRight size={13} />
                  </Link>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      case: 'TC-2019-0124',
                      title: 'Contractor Misclassification — Worker Reclassified as Employee',
                      year: 2019,
                      outcome: 'Taxpayer LOST',
                      assessment: '$180,000',
                      relevance: 'HIGH',
                      summary: 'IRS reclassified 3 independent contractors as employees based on behavioral and economic control tests. Employer owed back FICA, FUTA, and penalties.',
                      keywords: ['1099', 'contractor', 'employee', 'FICA'],
                    },
                    {
                      case: 'TC-2021-0087',
                      title: 'S-Corp Reasonable Compensation — Below-Market Salary',
                      year: 2021,
                      outcome: 'Taxpayer LOST',
                      assessment: '$94,000',
                      relevance: 'HIGH',
                      summary: 'Owner-operator paid minimal salary to maximize S-Corp distributions and reduce FICA. IRS recharacterized distributions as wages.',
                      keywords: ['S-Corp', 'distributions', 'FICA', 'reasonable compensation'],
                    },
                    {
                      case: 'TC-2020-0203',
                      title: 'Home Office Deduction Denied — IRC §280A',
                      year: 2020,
                      outcome: 'Taxpayer LOST',
                      assessment: '$12,400',
                      relevance: 'MEDIUM',
                      summary: 'Taxpayer failed to demonstrate exclusive and regular use of home office space. Mixed-use space did not qualify under §280A.',
                      keywords: ['home office', '280A', 'exclusive use'],
                    },
                  ].map(p => (
                    <div key={p.case} className="card p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-[var(--text-muted)]">{p.case}</span>
                            <span className="text-xs text-[var(--text-muted)]">·</span>
                            <span className="text-xs text-[var(--text-muted)]">{p.year}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              p.relevance === 'HIGH'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {p.relevance} Relevance
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{p.title}</h4>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 shrink-0 font-medium">
                          {p.outcome}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">{p.summary}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {p.keywords.map(k => (
                            <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{k}</span>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-red-600 shrink-0">{p.assessment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Session Timer / Phase Indicator */}
        <aside className="hidden xl:flex w-64 border-l border-[var(--border-color)] bg-white flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Session Timer</div>
            <div className="text-3xl font-mono font-bold text-[var(--text-primary)] mb-1">{formatTime(sessionTime)}</div>
            <div className="text-xs text-[var(--text-muted)]">Phase 2 — Live Session</div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--intuit-blue)] rounded-full transition-all"
                style={{ width: `${Math.min((sessionTime / 3600) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">of 60-min session</div>
          </div>

          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">3-Phase Workflow</div>
            <div className="space-y-3">
              {[
                { phase: '1', label: 'Pre-Session', sub: 'Brief generated', done: true },
                { phase: '2', label: 'Live Session', sub: 'Active now', active: true },
                { phase: '3', label: 'Post-Session', sub: 'Coming up', done: false },
              ].map(p => (
                <div key={p.phase} className={`flex items-center gap-3 ${p.active ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    p.done ? 'bg-green-100 text-green-700' :
                    p.active ? 'bg-[var(--intuit-blue)] text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {p.done ? <CheckCircle2 size={13} /> : p.phase}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">{p.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Governance</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{pendingCount}</span>
              <span className="text-xs text-[var(--text-muted)]">pending<br />approvals</span>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={() => setActiveTab('governance')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <AlertTriangle size={13} />
                Review Now
              </button>
            )}
          </div>

          <div className="mt-auto p-4 border-t border-[var(--border-color)]">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--intuit-blue)] transition-colors"
            >
              <Clock size={13} />
              Next: Riviera Salon — 3:30 PM
            </Link>
          </div>
        </aside>

      </main>
    </>
  );
}
