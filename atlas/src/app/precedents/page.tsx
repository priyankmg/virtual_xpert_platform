'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Search, X } from 'lucide-react';
import { irsPrecedents } from '@/data/mock/irs-precedents';

interface Precedent {
  id: string;
  title: string;
  year: number;
  topic: string;
  keyFacts: string;
  ruling: string;
  relevanceKeywords: string[];
  citationId: string;
  rulingSummary?: string;
  taxpayerOutcome?: string;
  applicabilityNote?: string;
  relevanceScore?: number;
}

const QUICK_FILTERS = ['contractor', 'S-Corp', 'home office', 'meals', 'Section 179', 'QBI', 'inventory', 'payroll'];

export default function Precedents() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Precedent[]>(irsPrecedents);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Precedent | null>(null);

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults(irsPrecedents); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/agents/rag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, clientId: 'CLIENT-001' }),
      });
      const data = await res.json();
      setResults(data.precedents?.length > 0 ? data.precedents : irsPrecedents);
    } catch { setResults(irsPrecedents); }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header title="IRS Precedent Library" subtitle="Tax Court rulings, audit cases, and IRS guidance" />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Search */}
        <div className="relative mb-4 max-w-xl">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-shadow"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1E293B', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            placeholder="Search by keyword, topic, or issue (e.g. 'contractor classification')"
            value={query}
            onChange={e => search(e.target.value)}
          />
          {query && (
            <button onClick={() => search('')} className="absolute right-3.5 top-3.5 p-0.5 rounded hover:bg-slate-100 transition-colors">
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {QUICK_FILTERS.map(kw => (
            <button
              key={kw}
              onClick={() => search(query === kw ? '' : kw)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                query === kw
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {kw}
            </button>
          ))}
          {query && (
            <button onClick={() => search('')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="text-xs font-semibold mb-4" style={{ color: '#94A3B8' }}>
          {loading ? 'Searching…' : `${results.length} case${results.length !== 1 ? 's' : ''} ${query ? `matching "${query}"` : 'in library'}`}
        </div>

        {/* Cards grid — responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className="card p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug" style={{ color: '#1E293B' }}>{p.title}</div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: '#94A3B8' }}>{p.citationId}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">{p.year}</span>
                  {(p.relevanceScore ?? 0) > 0 && (
                    <span className="text-xs font-semibold" style={{ color: '#0077C5' }}>{(p.relevanceScore! * 100).toFixed(0)}% match</span>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748B' }}>{p.topic}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${(p.taxpayerOutcome ?? '').startsWith('WON') ? 'text-green-600' : 'text-red-600'}`}>
                  {(p.taxpayerOutcome ?? '').split(' — ')[0] || '—'}
                </span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
                  {p.relevanceKeywords.slice(0, 3).map(kw => (
                    <span key={kw} className="text-xs px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold" style={{ color: '#1E293B' }}>{selected.title}</h2>
                <div className="text-sm mt-1" style={{ color: '#94A3B8' }}>{selected.citationId} · {selected.year}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0 ml-3">
                <X size={16} style={{ color: '#94A3B8' }} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="section-title mb-2">Topic</div>
                <p className="text-sm font-medium" style={{ color: '#1E293B' }}>{selected.topic}</p>
              </div>
              <div>
                <div className="section-title mb-2">Key Facts</div>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{selected.keyFacts}</p>
              </div>
              <div>
                <div className="section-title mb-2">Ruling</div>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{selected.ruling}</p>
              </div>
              {selected.applicabilityNote && (
                <div className="p-4 rounded-xl border border-blue-200" style={{ background: '#EFF6FF' }}>
                  <div className="section-title mb-1" style={{ color: '#0077C5' }}>Applicability to Meridian</div>
                  <p className="text-sm leading-relaxed" style={{ color: '#1E3A8A' }}>{selected.applicabilityNote}</p>
                </div>
              )}
              <div>
                <div className="section-title mb-2">Taxpayer Outcome</div>
                <span className={`text-sm font-bold ${(selected.taxpayerOutcome ?? '').startsWith('WON') ? 'text-green-600' : 'text-red-600'}`}>
                  {selected.taxpayerOutcome}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
