'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Search, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import ClientBanner from '@/components/ui/ClientBanner';
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

// ── Precedent type categories ─────────────────────────────────────────────────
interface PrecedentType {
  value: string;
  label: string;
  description: string;
  keywords: string[];
  color: string;
  count?: number;
}

const PRECEDENT_TYPES: PrecedentType[] = [
  {
    value: 'all',
    label: 'All Types',
    description: 'Show all IRS precedents in the library',
    keywords: [],
    color: 'text-slate-600',
  },
  {
    value: 'contractor',
    label: 'Contractor Classification',
    description: 'Worker classification — employee vs 1099 contractor rulings',
    keywords: ['1099', 'contractor', 'employee', 'worker classification', 'payroll tax'],
    color: 'text-red-600',
  },
  {
    value: 'scorp',
    label: 'S-Corp & Compensation',
    description: 'S-Corp reasonable compensation, distributions, FICA avoidance',
    keywords: ['reasonable compensation', 'S-Corp', 'distributions', 'FICA', 'owner salary', '199A'],
    color: 'text-orange-600',
  },
  {
    value: 'home-office',
    label: 'Home Office',
    description: 'IRC 280A exclusive use, home office deduction eligibility',
    keywords: ['home office', '280A', 'exclusive use', 'regular use', 'deduction'],
    color: 'text-blue-600',
  },
  {
    value: 'meals',
    label: 'Meals & Entertainment',
    description: 'IRC 274, post-TCJA entertainment disallowance, 50% meal limit',
    keywords: ['meals', 'entertainment', '274', 'business purpose', 'TCJA', '50% limit'],
    color: 'text-amber-600',
  },
  {
    value: 'depreciation',
    label: 'Depreciation & Section 179',
    description: 'Section 179 expensing, recapture, bonus depreciation',
    keywords: ['Section 179', 'recapture', 'depreciation', 'recovery period', '4562'],
    color: 'text-purple-600',
  },
  {
    value: 'payroll',
    label: 'Payroll Tax',
    description: 'FTD penalties, 941/940 filings, first-time abatement',
    keywords: ['payroll tax deposit', 'FTD penalty', '941', 'first-time abatement', 'FTA', '940'],
    color: 'text-teal-600',
  },
  {
    value: 'qbi',
    label: 'QBI & Pass-Through',
    description: 'IRC 199A qualified business income, SSTB classification',
    keywords: ['199A', 'QBI', 'specified service', 'SSTB', 'consulting', 'phase-out'],
    color: 'text-green-600',
  },
  {
    value: 'inventory',
    label: 'Inventory & COGS',
    description: 'Inventory write-downs, lower of cost or market, FIFO/LIFO',
    keywords: ['inventory', 'write-down', 'COGS', 'lower of cost or market', 'obsolescence', 'FIFO'],
    color: 'text-indigo-600',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function filterByType(precedents: Precedent[], typeValue: string): Precedent[] {
  if (typeValue === 'all') return precedents;
  const type = PRECEDENT_TYPES.find(t => t.value === typeValue);
  if (!type) return precedents;
  return precedents.filter(p =>
    type.keywords.some(kw =>
      p.relevanceKeywords.some(rk => rk.toLowerCase().includes(kw.toLowerCase())) ||
      p.topic.toLowerCase().includes(kw.toLowerCase()) ||
      p.title.toLowerCase().includes(kw.toLowerCase())
    )
  );
}

function filterByQuery(precedents: Precedent[], q: string): Precedent[] {
  if (!q.trim()) return precedents;
  const lower = q.toLowerCase();
  return precedents.filter(p =>
    p.title.toLowerCase().includes(lower) ||
    p.topic.toLowerCase().includes(lower) ||
    p.keyFacts.toLowerCase().includes(lower) ||
    p.relevanceKeywords.some(kw => kw.toLowerCase().includes(lower))
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Precedents() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<Precedent | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResults, setAiResults] = useState<Precedent[] | null>(null);

  const activeType = PRECEDENT_TYPES.find(t => t.value === selectedType) ?? PRECEDENT_TYPES[0];

  // Local filtered results (type + text query)
  const localResults = useMemo(() => {
    const typed = filterByType(irsPrecedents, selectedType);
    return filterByQuery(typed, query);
  }, [selectedType, query]);

  const displayResults = aiResults ?? localResults;

  // AI RAG search (only when query is non-trivial)
  const runAiSearch = async (q: string) => {
    if (!q.trim() || q.length < 4) { setAiResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/agents/rag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, clientId: 'CLIENT-001' }),
      });
      const data = await res.json();
      if (data.precedents?.length > 0) setAiResults(data.precedents);
      else setAiResults(null);
    } catch {
      setAiResults(null);
    }
    setLoading(false);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    if (!v) setAiResults(null);
    else runAiSearch(v);
  };

  const handleTypeSelect = (value: string) => {
    setSelectedType(value);
    setTypeDropdownOpen(false);
    setAiResults(null);
    setQuery('');
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header title="IRS Precedent Library" subtitle="Tax Court rulings, audit cases, and IRS guidance" />
      <ClientBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl">

        {/* ── Single IRS Precedent Card ── */}
        <div className="card overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-color)] bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-amber-700" />
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">IRS Precedent Search</div>
              <div className="text-xs text-[var(--text-muted)]">{irsPrecedents.length} cases in library · Atlas RAG-powered</div>
            </div>
          </div>

          <div className="p-5 space-y-4">

            {/* Type selector dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                What type of precedent are you looking for?
              </label>
              <div className="relative">
                <button
                  onClick={() => setTypeDropdownOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                  style={{ background: '#FFFFFF', border: '1.5px solid #0077C5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-semibold ${activeType.color}`}>{activeType.label}</span>
                    <span className="text-xs text-[var(--text-muted)] truncate hidden sm:block">— {activeType.description}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-semibold">
                      {filterByType(irsPrecedents, selectedType).length} cases
                    </span>
                    {typeDropdownOpen ? <ChevronUp size={14} className="text-[var(--brand-blue)]" /> : <ChevronDown size={14} className="text-[var(--brand-blue)]" />}
                  </div>
                </button>

                {typeDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-20"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                  >
                    {PRECEDENT_TYPES.map(type => {
                      const count = filterByType(irsPrecedents, type.value).length;
                      return (
                        <button
                          key={type.value}
                          onClick={() => handleTypeSelect(type.value)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-[var(--border-color)] last:border-0 ${selectedType === type.value ? 'bg-[var(--brand-blue-light)]' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold ${type.color}`}>{type.label}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">{type.description}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium shrink-0 mt-0.5">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
                placeholder="Refine by keyword (e.g. 'exclusive use', 'recapture')…"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
              />
              {query && (
                <button onClick={() => { setQuery(''); setAiResults(null); }} className="absolute right-3 top-2.5 p-0.5 rounded hover:bg-slate-100 transition-colors">
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {loading ? 'Searching via AI RAG…' : (
                  <>
                    <span className="font-semibold text-[var(--text-primary)]">{displayResults.length}</span>
                    {' '}case{displayResults.length !== 1 ? 's' : ''}
                    {aiResults ? ' · AI-ranked results' : query ? ` matching "${query}"` : selectedType !== 'all' ? ` · ${activeType.label}` : ' in library'}
                  </>
                )}
              </span>
              {aiResults && (
                <button onClick={() => setAiResults(null)} className="text-xs text-[var(--brand-blue)] hover:underline">
                  Clear AI results
                </button>
              )}
            </div>

            {/* Results list */}
            {displayResults.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                <div className="text-sm">No cases match your search.</div>
                <button onClick={() => { setQuery(''); setSelectedType('all'); setAiResults(null); }} className="text-xs text-[var(--brand-blue)] mt-1 hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)] -mx-5 -mb-5">
                {displayResults.map((p, i) => {
                  const won = (p.taxpayerOutcome ?? '').startsWith('WON');
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors group"
                    >
                      {/* Number + year */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <span className="text-xs text-[var(--text-muted)] font-medium w-5 text-center">#{i + 1}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{p.year}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--brand-blue)] transition-colors">
                            {p.title}
                          </div>
                          {(p.relevanceScore ?? 0) > 0 && (
                            <span className="text-xs font-semibold text-[var(--brand-blue)] shrink-0">
                              {(p.relevanceScore! * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.citationId}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">{p.topic}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs font-semibold ${won ? 'text-green-600' : 'text-red-600'}`}>
                            {(p.taxpayerOutcome ?? '').split(' — ')[0] || '—'}
                          </span>
                          {p.relevanceKeywords.slice(0, 3).map(kw => (
                            <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{kw}</span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
