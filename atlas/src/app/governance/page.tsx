'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

interface LogEntry {
  logId: string;
  timestamp: string;
  agentName: string;
  actionType: 'READ' | 'ADVISORY' | 'ACTION';
  clientId: string;
  inputSummary: string;
  outputSummary: string;
  confidenceScore: number;
  expertReviewRequired: boolean;
  expertApproved: boolean | null;
  expertId: string | null;
}

export default function Governance() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, setPending] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    const [logRes, pendingRes] = await Promise.all([
      fetch('/api/governance/log'),
      fetch('/api/governance/pending'),
    ]);
    setLog(await logRes.json());
    setPending(await pendingRes.json());
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const approve = async (logId: string, action: 'approve' | 'reject') => {
    await fetch('/api/governance/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, action, expertId: 'EXPERT-001' }),
    });
    load();
  };

  const filtered = filter === 'ALL' ? log : log.filter(e => e.actionType === filter);

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header
        title="Governance Log"
        subtitle="Audit trail — auto-refreshes every 10 seconds"
        action={
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Pending Approvals */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-orange-500" />
              <h2 className="text-sm font-semibold" style={{ color: '#1E293B' }}>Pending Expert Approvals</h2>
              <span className="badge-action">{pending.length}</span>
            </div>
            <div className="space-y-3">
              {pending.map(entry => (
                <div key={entry.logId} className="card p-4 border-orange-200" style={{ background: '#FFF7ED' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="badge-action">ACTION</span>
                        <span className="text-sm font-semibold" style={{ color: '#92400E' }}>{entry.agentName}</span>
                        <span className="text-xs" style={{ color: '#B45309' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: '#B45309' }}>{entry.inputSummary}</p>
                      <p className="text-xs" style={{ color: '#92400E' }}>{entry.outputSummary}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approve(entry.logId, 'approve')} className="btn-primary text-xs px-3 py-1.5">
                        <CheckCircle2 size={13} />Approve
                      </button>
                      <button onClick={() => approve(entry.logId, 'reject')} className="btn-secondary text-xs px-3 py-1.5">
                        <XCircle size={13} />Override
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'READ', 'ADVISORY', 'ACTION'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="text-xs font-medium ml-1" style={{ color: '#94A3B8' }}>{filtered.length} entries</span>
        </div>

        {/* Log table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th className="hidden md:table-cell">Output</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#94A3B8' }}>
                      No log entries yet. Run the pipeline from the Dashboard.
                    </td>
                  </tr>
                ) : filtered.map(entry => (
                  <tr key={entry.logId}>
                    <td className="font-mono text-xs whitespace-nowrap" style={{ color: '#64748B' }}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-medium text-xs whitespace-nowrap" style={{ color: '#1E293B' }}>{entry.agentName}</td>
                    <td>
                      <span className={entry.actionType === 'READ' ? 'badge-read' : entry.actionType === 'ADVISORY' ? 'badge-advisory' : 'badge-action'}>
                        {entry.actionType}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-xs max-w-[250px] truncate" style={{ color: '#64748B' }} title={entry.outputSummary}>
                      {entry.outputSummary}
                    </td>
                    <td className="text-xs font-semibold" style={{ color: '#64748B' }}>
                      {(entry.confidenceScore * 100).toFixed(0)}%
                    </td>
                    <td>
                      {entry.expertApproved === true ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 size={11} />Approved</span>
                      ) : entry.expertApproved === false ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle size={11} />Overridden</span>
                      ) : entry.expertReviewRequired ? (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock size={11} />Pending</span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>Auto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
