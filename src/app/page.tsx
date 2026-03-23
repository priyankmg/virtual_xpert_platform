'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle2, Circle, Loader2, AlertTriangle,
  ChevronRight, ChevronDown, Play, Sparkles, Star, TrendingUp,
  Users, Calendar, ShieldCheck, Zap, BarChart3,
  Check, ClipboardList,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { SessionItem, ExpertProfile, sessionStats as mockStats, todaySessions as mockSessions } from '@/data/mock/expert-sessions';
import { useSelectedClient } from '@/components/layout/AppShell';

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
  BRIEF_COMPLETE: {
    label: 'Brief Complete',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={14} className="text-emerald-600" />,
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

/** Sort key for today's session times e.g. "2:00 PM" */
function parseTimeToMinutes(t: string): number {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  const ap = m[3]!.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function sortSessionsByTime(list: SessionItem[]): SessionItem[] {
  return [...list].sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime));
}

function ClientSelector({ sessions, selectedId, onChange }: {
  sessions: SessionItem[];
  selectedId: string | null;
  onChange: (session: SessionItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = sessions.find(s => s.clientId === selectedId);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-white text-sm font-medium text-[var(--text-primary)] hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue-light)] transition-all shadow-sm min-w-[220px] justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          <Users size={14} className="text-[var(--brand-blue)] shrink-0" />
          {selected ? selected.clientName : 'Select a client…'}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-72 bg-white border border-[var(--border-color)] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] px-2 py-1">Today&apos;s Sessions</div>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {sessions.map(s => {
              const status = STATUS_CONFIG[s.status];
              const isSelected = s.clientId === selectedId;
              return (
                <button
                  key={s.clientId}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${isSelected ? 'bg-[var(--brand-blue-light)]' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    s.status === 'IN_PROGRESS' ? 'bg-blue-500 animate-pulse' :
                    s.status === 'COMPLETED' ? 'bg-green-500' :
                    s.status === 'BRIEF_COMPLETE' ? 'bg-emerald-500' :
                    'bg-slate-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{s.clientName}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{s.scheduledTime} · {s.entityType}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                      {status.icon}
                    </span>
                    {isSelected && <Check size={13} className="text-[var(--brand-blue)]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onRunBrief, isSelected, onSelect }: {
  session: SessionItem;
  onRunBrief: (id: string) => void;
  isSelected: boolean;
  onSelect: (session: SessionItem) => void;
}) {
  const router = useRouter();
  const status = STATUS_CONFIG[session.status];
  const risk = RISK_CONFIG[session.riskLevel];
  const isActive = session.status === 'IN_PROGRESS';

  function handlePrepare() {
    onSelect(session);
    router.push(`/session-prep/${session.clientId}`);
  }

  return (
    <div
      className={`card transition-all hover:shadow-md cursor-pointer ${
        isActive ? 'ring-2 ring-[var(--brand-blue)] ring-offset-1' :
        isSelected ? 'ring-2 ring-[var(--accent-orange)] ring-offset-1' : ''
      }`}
      onClick={() => onSelect(session)}
    >
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
              {isSelected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                  <Check size={10} />
                  Active Client
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
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-blue)] text-white text-sm font-medium hover:bg-[var(--brand-blue-dark)] transition-colors"
            >
              <Zap size={14} />
              Live Session
            </Link>
          )}
          {(session.status === 'PREP_READY' || session.status === 'NOT_STARTED') && (
            <button
              onClick={e => { e.stopPropagation(); handlePrepare(); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-blue)] text-white text-sm font-medium hover:bg-[var(--brand-blue-dark)] transition-colors"
            >
              <Play size={13} />
              Prepare for Session
            </button>
          )}
          {session.status === 'BRIEF_COMPLETE' && (
            <Link
              href={`/session-prep/${session.clientId}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={13} />
              View Pre-Brief
            </Link>
          )}
          {session.status === 'COMPLETED' && (
            <Link
              href="/session-brief"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              View Summary
            </Link>
          )}
          <Link
            href="/financial-snapshot"
            onClick={e => { e.stopPropagation(); onSelect(session); }}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-100 text-[var(--text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
            title="Financial Snapshot"
          >
            <BarChart3 size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { selectedClient, setSelectedClient } = useSelectedClient();
  const [sessions, setSessions] = useState<SessionItem[]>(mockSessions);
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const [briefRunning, setBriefRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/expert/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || mockSessions);
        setExpert(data.expert || null);
        setStats(data.stats || mockStats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRunBrief(clientId: string) {
    setBriefRunning(clientId);
    try {
      await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
    } catch {}
    finally { setBriefRunning(null); }
  }

  function handleSelectSession(session: SessionItem) {
    setSelectedClient({
      clientId: session.clientId,
      clientName: session.clientName,
      entityType: session.entityType,
      sessionId: session.sessionId,
      sessionTopic: session.topic,
      briefStatus: session.status as 'NOT_STARTED' | 'BRIEF_COMPLETE' | 'IN_PROGRESS' | 'COMPLETED',
    });
  }

  const activeSession = sessions.find(s => s.status === 'IN_PROGRESS');

  const { upcomingSessions, completedSessions } = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'COMPLETED');
    const upcoming = sessions.filter(s => s.status !== 'COMPLETED');
    return {
      upcomingSessions: sortSessionsByTime(upcoming),
      completedSessions: sortSessionsByTime(completed),
    };
  }, [sessions]);

  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <>
      <Header
        title="Expert Dashboard"
        action={
          <ClientSelector
            sessions={sessions}
            selectedId={selectedClient?.clientId ?? null}
            onChange={handleSelectSession}
          />
        }
      />
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">

        {/* Expert Hero */}
        {expert && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-blue)] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                  {expert.initials}
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)] text-lg">{expert.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {expert.credentials.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium">{c}</span>
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
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{expert.yearsWithPlatform}y</div>
                  <div className="text-xs text-[var(--text-muted)]">on platform</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Sessions Today', value: stats.totalToday, icon: <Calendar size={16} />, color: 'text-[var(--brand-blue)]' },
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
          <div className="mb-6 p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <div className="min-w-0">
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

            <div className="rounded-lg bg-white/80 border border-blue-100 p-3 sm:p-4">
              <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--brand-blue)] text-white text-[10px]">1</span>
                Suggested workflow — start with <span className="text-[var(--brand-blue)]">Client analysis</span> before going live
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-center gap-2 sm:gap-1">
                  <Link
                    href={`/session-prep/${activeSession.clientId}`}
                    className="group flex-1 flex flex-col sm:flex-row items-center gap-2 px-3 py-3 rounded-xl border-2 border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] shadow-sm hover:border-[var(--brand-blue-dark)] hover:shadow transition-all min-h-[88px] sm:min-h-0 justify-center text-center sm:text-left"
                  >
                    <BarChart3 size={20} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-blue)]">Step 1 · Start here</div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">Client analysis</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 hidden sm:block">Prep, data & context</div>
                    </div>
                  </Link>
                  <ChevronRight className="hidden sm:flex self-center text-blue-300 shrink-0 w-5 h-5" aria-hidden />
                  <ChevronDown className="sm:hidden self-center text-blue-300 w-5 h-5" aria-hidden />

                  <Link
                    href="/governance"
                    className="group flex-1 flex flex-col sm:flex-row items-center gap-2 px-3 py-3 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-secondary)] hover:border-[var(--brand-blue)] hover:bg-slate-50/80 transition-all min-h-[88px] sm:min-h-0 justify-center text-center sm:text-left"
                  >
                    <ClipboardList size={20} className="shrink-0 text-[var(--brand-blue)]" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Step 2</div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">Review & actions</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 hidden sm:block">Governance & approvals</div>
                    </div>
                  </Link>
                  <ChevronRight className="hidden sm:flex self-center text-blue-300 shrink-0 w-5 h-5" aria-hidden />
                  <ChevronDown className="sm:hidden self-center text-blue-300 w-5 h-5" aria-hidden />

                  <Link
                    href={`/session-live/${activeSession.clientId}`}
                    className="group flex-1 flex flex-col sm:flex-row items-center gap-2 px-3 py-3 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-secondary)] hover:border-[var(--brand-blue)] hover:bg-slate-50/80 transition-all min-h-[88px] sm:min-h-0 justify-center text-center sm:text-left"
                  >
                    <Zap size={20} className="shrink-0 text-[var(--accent-orange)]" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Step 3</div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">Live session</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 hidden sm:block">Real-time with client</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Client Banner */}
        {selectedClient && (
          <div className="mb-6 p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <Check size={15} className="text-orange-600" />
              <span className="font-medium text-orange-800">Active Client Context:</span>
              <span className="text-orange-700">{selectedClient.clientName}</span>
              <span className="text-orange-500">·</span>
              <span className="text-orange-600">{selectedClient.entityType}</span>
              {selectedClient.sessionTopic && (
                <>
                  <span className="text-orange-500 hidden sm:inline">·</span>
                  <span className="text-orange-600 hidden sm:inline">{selectedClient.sessionTopic}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/financial-snapshot" className="text-[var(--brand-blue)] font-medium hover:underline flex items-center gap-1 text-xs">
                View financial data <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Session Queue — collapsible upcoming + completed */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={18} className="text-[var(--brand-blue)]" />
              Today&apos;s Session Queue
            </h2>
            <Link href="/agents" className="text-sm text-[var(--brand-blue)] hover:underline flex items-center gap-1">
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
            <div className="space-y-3">
              {/* Upcoming (non-completed) — calendar-style by time */}
              <div className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setUpcomingOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors border-b border-[var(--border-color)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--brand-blue-light)] flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-[var(--brand-blue)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">Upcoming sessions</div>
                      <div className="text-xs text-[var(--text-muted)]">Sorted by time of day · includes in-progress &amp; scheduled</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)]">
                      {upcomingSessions.length}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--text-muted)] transition-transform ${upcomingOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {upcomingOpen && (
                  <div className="p-4 sm:p-5 bg-[var(--bg-page)]">
                    {upcomingSessions.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-6">No upcoming sessions today.</p>
                    ) : (
                      <div className="space-y-0">
                        <div className="hidden sm:grid sm:grid-cols-[88px_1fr] gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] px-1 pb-2 border-b border-[var(--border-color)] mb-3">
                          <span>Time</span>
                          <span>Session</span>
                        </div>
                        {upcomingSessions.map(session => (
                          <div
                            key={session.sessionId}
                            className="grid grid-cols-1 sm:grid-cols-[88px_1fr] gap-3 sm:gap-4 py-4 border-b border-[var(--border-color)] last:border-0 last:pb-0 first:pt-0"
                          >
                            <div className="flex sm:flex-col sm:items-start gap-2">
                              <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Time</span>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] tabular-nums shadow-sm">
                                <Clock size={12} className="text-[var(--brand-blue)] shrink-0" />
                                {session.scheduledTime}
                              </div>
                            </div>
                            <SessionCard
                              session={session}
                              onRunBrief={handleRunBrief}
                              isSelected={selectedClient?.clientId === session.clientId}
                              onSelect={handleSelectSession}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Completed */}
              <div className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCompletedOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors border-b border-[var(--border-color)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">Completed sessions</div>
                      <div className="text-xs text-[var(--text-muted)]">Wrapped for today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      {completedSessions.length}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--text-muted)] transition-transform ${completedOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {completedOpen && (
                  <div className="p-4 sm:p-5 bg-[var(--bg-page)]">
                    {completedSessions.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-6">No completed sessions yet.</p>
                    ) : (
                      <div className="space-y-0">
                        <div className="hidden sm:grid sm:grid-cols-[88px_1fr] gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] px-1 pb-2 border-b border-[var(--border-color)] mb-3">
                          <span>Time</span>
                          <span>Session</span>
                        </div>
                        {completedSessions.map(session => (
                          <div
                            key={session.sessionId}
                            className="grid grid-cols-1 sm:grid-cols-[88px_1fr] gap-3 sm:gap-4 py-4 border-b border-[var(--border-color)] last:border-0 last:pb-0 first:pt-0"
                          >
                            <div className="flex sm:flex-col sm:items-start gap-2">
                              <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Time</span>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] tabular-nums shadow-sm">
                                <Clock size={12} className="text-green-600 shrink-0" />
                                {session.scheduledTime}
                              </div>
                            </div>
                            <SessionCard
                              session={session}
                              onRunBrief={handleRunBrief}
                              isSelected={selectedClient?.clientId === session.clientId}
                              onSelect={handleSelectSession}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {briefRunning && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-700 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Generating session brief… running DAS + all agents
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent-orange)]" />
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
                <div className="text-[var(--brand-blue)] group-hover:text-[var(--brand-blue-dark)] transition-colors">{link.icon}</div>
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
