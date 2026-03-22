'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  X, LayoutDashboard, Database, FileText, ShieldCheck,
  Search, Calculator, ClipboardList, Bot, Zap, Star, BarChart2,
  Activity,
} from 'lucide-react';

// ── Smart tooltip configuration ────────────────────────────────────────────────
// lastVisited: ISO date string. If null → feature is "new" (never visited).
// Shows a tooltip indicator when: isNew OR lastVisited was >30 days ago.
interface NavTooltipMeta {
  tip: string;
  isNew?: boolean;
  lastVisitedKey: string; // localStorage key for this route's last visit
}

const NAV_TOOLTIPS: Record<string, NavTooltipMeta> = {
  '/precedents': {
    tip: 'You haven\'t used IRS Precedents in a while. Tap to search case history for your active clients.',
    lastVisitedKey: 'vep_nav_visited_precedents',
  },
  '/governance': {
    tip: 'Governance Log tracks every AI action taken — including auto-approved LOW-risk items.',
    lastVisitedKey: 'vep_nav_visited_governance',
  },
  '/admin-metrics': {
    tip: 'New: Admin Engagement Dashboard — user adoption funnel, feature usage & AI model trends for product teams.',
    isNew: true,
    lastVisitedKey: 'vep_nav_visited_admin_metrics',
  },
  '/agents': {
    tip: 'New: Self-Healing API Agent now monitors all source systems in real time.',
    isNew: true,
    lastVisitedKey: 'vep_nav_visited_agents',
  },
  '/my-metrics': {
    tip: 'New: AI-generated performance summary now appears at the top of your metrics.',
    isNew: true,
    lastVisitedKey: 'vep_nav_visited_my_metrics',
  },
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function shouldShowTip(meta: NavTooltipMeta): boolean {
  if (meta.isNew) return true;
  try {
    const raw = localStorage.getItem(meta.lastVisitedKey);
    if (!raw) return true; // never visited
    return Date.now() - new Date(raw).getTime() > THIRTY_DAYS_MS;
  } catch {
    return false;
  }
}

// ── Nav items ──────────────────────────────────────────────────────────────────
const navItems = [
  { href: '/',                    label: 'Work Queue',       icon: LayoutDashboard, section: 'expert'   },
  { href: '/financial-snapshot',  label: 'Financial Snapshot', icon: Database,       section: 'client'   },
  { href: '/session-brief',       label: 'Session Brief',    icon: FileText,        section: 'client'   },
  { href: '/policy-review',       label: 'Policy Review',    icon: ShieldCheck,     section: 'client'   },
  { href: '/precedents',          label: 'IRS Precedents',   icon: Search,          section: 'client'   },
  { href: '/tax-estimate',        label: 'Tax Estimate',     icon: Calculator,      section: 'client'   },
  { href: '/governance',          label: 'Governance Log',   icon: ClipboardList,   section: 'platform' },
  { href: '/agents',              label: 'Agent Panel',      icon: Bot,             section: 'platform' },
  { href: '/my-metrics',          label: 'My Metrics',       icon: BarChart2,       section: 'platform' },
  { href: '/admin-metrics',       label: 'Admin Metrics',    icon: Activity,        section: 'platform', adminOnly: true },
];

const expertSectionItems  = navItems.filter(i => i.section === 'expert');
const clientSectionItems  = navItems.filter(i => i.section === 'client');
const platformSectionItems = navItems.filter(i => i.section === 'platform');

// ── SmartTip dot component ─────────────────────────────────────────────────────
function SmartTipDot({ meta, onDismiss }: { meta: NavTooltipMeta; onDismiss: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span className="relative ml-auto shrink-0" style={{ zIndex: 10 }}>
      <span
        className={`relative inline-flex w-2 h-2 cursor-pointer`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(); }}
      >
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${meta.isNew ? 'bg-orange-400' : 'bg-blue-400'}`} />
        <span className={`relative inline-flex rounded-full w-2 h-2 ${meta.isNew ? 'bg-orange-500' : 'bg-blue-400'}`} />
      </span>

      {hovered && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-56 p-3 rounded-xl shadow-xl text-xs text-white leading-relaxed pointer-events-none"
          style={{ background: '#1E293B', border: '1px solid #334155' }}
        >
          {meta.isNew && (
            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">✦ New</div>
          )}
          {meta.tip}
          <div className="text-slate-400 mt-1.5 text-[10px]">Click dot to dismiss</div>
          {/* Arrow */}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: '#1E293B' }}
          />
        </div>
      )}
    </span>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  // Track which tips are active (computed once on mount, then updated on dismiss)
  const [activeTips, setActiveTips] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    Object.entries(NAV_TOOLTIPS).forEach(([route, meta]) => {
      initial[route] = shouldShowTip(meta);
    });
    setActiveTips(initial);
  }, []);

  const dismissTip = useCallback((route: string) => {
    const meta = NAV_TOOLTIPS[route];
    if (!meta) return;
    try { localStorage.setItem(meta.lastVisitedKey, new Date().toISOString()); } catch { /* noop */ }
    setActiveTips(prev => ({ ...prev, [route]: false }));
  }, []);

  // Record visit whenever the route changes
  useEffect(() => {
    const meta = NAV_TOOLTIPS[pathname];
    if (!meta) return;
    try { localStorage.setItem(meta.lastVisitedKey, new Date().toISOString()); } catch { /* noop */ }
    setActiveTips(prev => ({ ...prev, [pathname]: false }));
  }, [pathname]);

  function NavLink({
    href,
    label,
    icon: Icon,
    adminOnly = false,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    adminOnly?: boolean;
  }) {
    const isExactActive = pathname === href;
    const isActive = href === '/' ? isExactActive : pathname === href || pathname.startsWith(href + '/');
    const meta = NAV_TOOLTIPS[href];
    const showTip = !!meta && !!activeTips[href];

    return (
      <Link
        href={href}
        onClick={onClose}
        className={`sidebar-nav-item ${isActive ? 'active' : ''} ${adminOnly ? 'opacity-80' : ''}`}
        style={adminOnly && !isActive ? { borderStyle: 'dashed', borderColor: '#E2E8F0', borderWidth: '1px' } : {}}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate flex-1">{label}</span>
        {adminOnly && !isActive && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold uppercase tracking-wide shrink-0">
            Admin
          </span>
        )}
        {showTip && !adminOnly && (
          <SmartTipDot meta={meta} onDismiss={() => dismissTip(href)} />
        )}
        {showTip && adminOnly && (
          <SmartTipDot meta={meta} onDismiss={() => dismissTip(href)} />
        )}
      </Link>
    );
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full w-64 flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:shadow-md transition-shadow"
              style={{ background: 'linear-gradient(135deg, #0077C5, #0055A4)' }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight group-hover:text-[#0077C5] transition-colors" style={{ color: '#1E293B' }}>Atlas</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>Virtual Expert Platform</div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} style={{ color: '#94A3B8' }} />
          </button>
        </div>

        {/* Expert chip */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #BAE0F7' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-[var(--brand-blue)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
              MR
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#1E293B' }}>Marcus Rivera</div>
              <div className="text-xs" style={{ color: '#0077C5' }}>CPA · QuickBooks ProAdvisor</div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#64748B' }}>
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span>4.87 CSAT · 94% Atlas adoption</span>
          </div>
        </div>

        {/* Active client */}
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div className="text-xs" style={{ color: '#92400E' }}>Active Session — 2:00 PM</div>
          <div className="text-xs font-semibold" style={{ color: '#1E293B' }}>Meridian Home Goods</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="section-title px-3 mb-2">Expert</div>
          <div className="space-y-0.5 mb-4">
            {expertSectionItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>

          <div className="section-title px-3 mb-2">Client Analysis</div>
          <div className="space-y-0.5 mb-4">
            {clientSectionItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>

          <div className="section-title px-3 mb-2">Platform</div>
          <div className="space-y-0.5">
            {platformSectionItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>Virtual Expert Platform</div>
          <div className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>Prototype v2.1 · 2025</div>
        </div>
      </aside>
    </>
  );
}
