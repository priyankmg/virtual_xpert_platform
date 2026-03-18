'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, CheckCircle2, Circle, Loader2, AlertTriangle,
  ChevronRight, Play, Sparkles, Star, TrendingUp,
  Users, Calendar, ShieldCheck, Zap, BarChart3,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { SessionItem, ExpertProfile, sessionStats as mockStats } from '@/data/mock/expert-sessions';

const STATUS_CONFIG: Record<SessionItem['status'], {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
}> = {
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: <CheckCircle2 size={14} className="text-green-600" />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Loader2 size={14} className="text-blue-600 animate-spin" />,
  },
  PREP_READY: {
    label: 'Prep Ready',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: <ShieldCheck size={14} className="text-orange-600" />,
  },
  NOT_STARTED: {
    label: 'Not Started',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
    icon: <Circle size={14} className="text-slate-400" />,
  },
};

const RISK_CONFIG: Record<SessionItem['riskLevel'], { badge: string }> = {
  HIGH:   { badge: 'bg-red-100 text-red-700 border border-red-200' },
  MEDIUM: { badge: 'bg-amber-100 text-amber-700 border border-amber-200' },
  LOW:    { badge: 'bg-green-100 text-green-700 border border-green-200' },
};

function SessionCard({ session, onRunBrief }: { session: SessionItem; onRunBrief: (id: string) => void }) {
  const status = STATUS_CONFIG[session.status];
  const risk = RISK_CONFIG[session.riskLevel];
  const isActive = session.status === 'IN_PROGRESS';

  return (
    <div className={`card transition-all hover:shadow-md ${isActive ? 'ring-2 ring-[var(--intuit-blue)] ring-offset-1' : ''}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                {status.icon}
                {status.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${risk.badge}`}>
                {session.riskLevel} Risk
              </span>
              {session.pendingActions > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                  <AlertTriangle size={10} />
                  {session.pendingActions} pending
                </span>
              )}
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] truncate">{session.clientName}</h3>
            <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{session.topic}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">
              <Clock size={13} className="text-[var(--text-muted)]" />
              {session.scheduledTime}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{session.entityType}</div>
          </div>
        </div>

        {session.csatScore && (
          <div className="flex items-center gap-1 mb-3 text-xs text-[var(--text-secondary)]">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span>{session.csatScore.toFixed(1)} CSAT</span>
            {session.durationMinutes && <span className="ml-2 text-[var(--text-muted)]">· {session.durationMinutes} min</span>}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
          {session.status === 'IN_PROGRESS' && (
            <Link
              href={`/session-live/${session.clientId}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--intuit-blue)] text-white text-sm font-medium hover:bg-[var(--intuit-blue-dark)] transition-colors"
            >
              <Zap size={14} />
              Live Session
            </Link>
          )}
          {(session.status === 'PREP_READY' || session.status === 'NOT_STARTED') && (
            <button
              onClick={() => onRunBrief(session.clientId)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--intuit-blue)] text-white text-sm font-medium hover:bg-[var(--intuit-blue-dark)] transition-colors"
            >
              <Play size={13} />
              {session.briefReady ? 'View Brief' : 'Generate Brief'}
            </button>
          )}
          {session.status === 'COMPLETED' && (
            <Link
              href="/session-brief"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              View Summary
            </Link>
          )}
          <Link
            href="/financial-snapshot"
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-100 text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <BarChart3 size={14} />
          </Link>
          <Link
            href="/governance"
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-100 text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <ShieldCheck size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const [briefRunning, setBriefRunning] = useState<string | null>(null);
  const [briefResult, setBriefResult] = useState<{ clientId: string; status: 'done' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/expert/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setExpert(data.expert || null);
        setStats(data.stats || mockStats);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRunBrief(clientId: string) {
    setBriefRunning(clientId);
    setBriefResult(null);
    try {
      await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      setBriefResult({ clientId, status: 'done' });
    } catch {
      setBriefResult({ clientId, status: 'error' });
    } finally {
      setBriefRunning(null);
    }
  }

  const activeSession = sessions.find(s => s.status === 'IN_PROGRESS');

  return (
    <>
      <Header title="Expert Dashboard" />
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">

        {/* Expert Hero */}
        {expert && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--intuit-blue)] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                  {expert.initials}
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)] text-lg">{expert.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {expert.credentials.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded bg-[var(--intuit-blue-light)] text-[var(--intuit-blue)] font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-1">
                    <Star size={18} className="text-amber-400 fill-amber-400" />
                    {expert.csatTrailing30Days}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">CSAT (30d)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(expert.atlasAdoptionRate * 100)}%</div>
                  <div className="text-xs text-[var(--text-muted)]">Atlas Adoption</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{expert.yearsWithIntuit}y</div>
                  <div className="text-xs text-[var(--text-muted)]">at Intuit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Sessions Today', value: stats.totalToday, icon: <Calendar size={16} />, color: 'text-[var(--intuit-blue)]' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={16} />, color: 'text-green-600' },
            { label: 'In Progress', value: stats.inProgress, icon: <Loader2 size={16} />, color: 'text-blue-600' },
            { label: 'Upcoming', value: stats.upcoming, icon: <Users size={16} />, color: 'text-orange-600' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 text-center">
              <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active Session Banner */}
        {activeSession && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <div>
                <span className="font-semibold text-blue-800">Active: </span>
                <span className="text-blue-700">{activeSession.clientName} — {activeSession.topic}</span>
              </div>
              {activeSession.pendingActions > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                  <AlertTriangle size={10} />
                  {activeSession.pendingActions} governance actions pending
                </span>
              )}
            </div>
            <Link
              href={`/session-live/${activeSession.clientId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--intuit-blue)] text-white text-sm font-medium hover:bg-[var(--intuit-blue-dark)] transition-colors"
            >
              <Zap size={14} />
              Enter Live Session
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Session Queue */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={18} className="text-[var(--intuit-blue)]" />
              Today&apos;s Session Queue
            </h2>
            <Link href="/agents" className="text-sm text-[var(--intuit-blue)] hover:underline flex items-center gap-1">
              Agent Control Panel <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map(session => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  onRunBrief={handleRunBrief}
                />
              ))}
            </div>
          )}

          {briefRunning && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-700 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Generating session brief… running DAS + all agents
            </div>
          )}
          {briefResult?.status === 'done' && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={14} />
                Session brief ready for {sessions.find(s => s.clientId === briefResult.clientId)?.clientName}
              </span>
              <Link href="/session-brief" className="text-[var(--intuit-blue)] font-medium hover:underline">
                View Brief →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--intuit-orange)]" />
            Quick Access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { href: '/session-brief', icon: <ShieldCheck size={20} />, label: 'Session Brief', desc: 'Full AI-prepared brief' },
              { href: '/policy-review', icon: <AlertTriangle size={20} />, label: 'Policy Review', desc: 'IRS compliance findings' },
              { href: '/tax-estimate', icon: <TrendingUp size={20} />, label: 'Tax Estimate', desc: '3-scenario model' },
              { href: '/precedents', icon: <BarChart3 size={20} />, label: 'IRS Precedents', desc: 'RAG retrieval library' },
              { href: '/financial-snapshot', icon: <BarChart3 size={20} />, label: 'Financial Data', desc: '6 source systems' },
              { href: '/governance', icon: <ShieldCheck size={20} />, label: 'Governance Log', desc: 'Audit trail & approvals' },
              { href: '/agents', icon: <Zap size={20} />, label: 'Agent Panel', desc: 'Run individual agents' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="card p-4 flex flex-col gap-2 hover:shadow-md transition-all group"
              >
                <div className="text-[var(--intuit-blue)] group-hover:text-[var(--intuit-blue-dark)] transition-colors">{link.icon}</div>
                <div className="font-medium text-[var(--text-primary)] text-sm">{link.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{link.desc}</div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
