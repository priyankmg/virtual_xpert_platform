'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X, LayoutDashboard, Database, FileText, ShieldCheck,
  Search, Calculator, ClipboardList, Bot, Zap, Star,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Work Queue', icon: LayoutDashboard, section: 'expert' },
  { href: '/financial-snapshot', label: 'Financial Snapshot', icon: Database, section: 'client' },
  { href: '/session-brief', label: 'Session Brief', icon: FileText, section: 'client' },
  { href: '/policy-review', label: 'Policy Review', icon: ShieldCheck, section: 'client' },
  { href: '/precedents', label: 'IRS Precedents', icon: Search, section: 'client' },
  { href: '/tax-estimate', label: 'Tax Estimate', icon: Calculator, section: 'client' },
  { href: '/governance', label: 'Governance Log', icon: ClipboardList, section: 'platform' },
  { href: '/agents', label: 'Agent Panel', icon: Bot, section: 'platform' },
];

const expertSectionItems = navItems.filter(i => i.section === 'expert');
const clientSectionItems = navItems.filter(i => i.section === 'client');
const platformSectionItems = navItems.filter(i => i.section === 'platform');

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
    const isActive = pathname === href || pathname.startsWith(href + '/') && href !== '/';
    const isExactActive = pathname === href;
    const active = href === '/' ? isExactActive : isActive;
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`sidebar-nav-item ${active ? 'active' : ''}`}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
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
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0077C5, #0055A4)' }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight" style={{ color: '#1E293B' }}>Atlas</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>Virtual Expert Platform</div>
            </div>
          </div>
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
            <div className="w-6 h-6 rounded-full bg-[var(--intuit-blue)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
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
          <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>Intuit Virtual Expert Platform</div>
          <div className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>Prototype v2.0 · 2025</div>
        </div>
      </aside>
    </>
  );
}
