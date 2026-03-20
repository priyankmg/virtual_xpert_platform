'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Zap, BarChart3, Bot, ShieldCheck, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'vep_whats_new_seen_v4';

interface Slide {
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  bullets: string[];
}

const SLIDES: Slide[] = [
  {
    badge: 'New Feature',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: <BarChart3 size={22} className="text-white" />,
    iconBg: 'bg-[#0077C5]',
    title: 'AI-Generated Performance Summary',
    description: 'Your My Metrics page now opens with an Atlas-generated narrative that tells you exactly how your month went — without reading tables.',
    bullets: [
      'Client coverage & entity mix at a glance',
      'Total AI hours saved (prep + automated LOW approvals)',
      'High-risk sessions & cognitive judgment patterns',
      'CSAT trends and which entity types work best with AI',
    ],
  },
  {
    badge: 'Improved',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    icon: <Zap size={22} className="text-white" />,
    iconBg: 'bg-green-600',
    title: 'Automated LOW-Risk Approvals',
    description: 'Atlas now autonomously approves LOW-risk policy actions with high confidence — no manual review required.',
    bullets: [
      'Routine deductions, standard depreciation, expense categorisation',
      'Saves ~3 min per auto-approved action',
      'Full audit trail still logged to Governance',
      'Override rate: 0% in last 30 days',
    ],
  },
  {
    badge: 'New Agent',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <Bot size={22} className="text-white" />,
    iconBg: 'bg-[#FF6900]',
    title: 'Self-Healing API Agent',
    description: 'A new platform-level agent continuously monitors all source system connections and agent health — auto-retrying failures before they reach you.',
    bullets: [
      'Real-time health checks across 6 data systems',
      'Exponential-backoff retry on transient failures',
      'Cache fallback when live data is unavailable',
      'Status visible in the Agent Control Panel',
    ],
  },
  {
    badge: 'New for Admins',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <ShieldCheck size={22} className="text-white" />,
    iconBg: 'bg-slate-700',
    title: 'Admin Engagement Dashboard',
    description: 'Product teams now have a dedicated metrics view showing user adoption funnels, feature usage rankings, and AI model performance trends.',
    bullets: [
      'User adoption funnel: sign-up → activation → retention',
      'Top 5 most-used & bottom 3 least-used features',
      'Per-agent call volume and confidence scores',
      'Monthly override rate trend — track if AI is improving',
    ],
  },
];

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }
    setVisible(false);
  }

  if (!visible) return null;

  const s = SLIDES[slide];
  const isFirst = slide === 0;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0077C5] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#1E293B]">What&apos;s New in Atlas</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">v2.1</span>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Slide body */}
        <div className="px-6 pt-6 pb-4">
          {/* Badge */}
          <div className="mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badgeColor}`}>{s.badge}</span>
          </div>

          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B] leading-tight">{s.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.description}</p>
            </div>
          </div>

          {/* Bullets */}
          <ul className="space-y-2 mb-5">
            {s.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0077C5] mt-1.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all ${i === slide ? 'w-5 h-1.5 bg-[#0077C5]' : 'w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setSlide(s => s - 1)}
            disabled={isFirst}
            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>

          <button
            onClick={dismiss}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-3"
          >
            Skip tour
          </button>

          {isLast ? (
            <button
              onClick={dismiss}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#0077C5] text-white hover:bg-[#0055A4] transition-colors"
            >
              Get Started <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => setSlide(s => s + 1)}
              className="flex items-center gap-1 text-sm font-medium text-[#0077C5] hover:text-[#0055A4] transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
