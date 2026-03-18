'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, Database, FileText, ShieldCheck, Search, Calculator, ClipboardList, Bot, Zap } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/financial-snapshot', label: 'Financial Snapshot', icon: Database },
  { href: '/session-brief', label: 'Session Brief', icon: FileText },
  { href: '/policy-review', label: 'Policy Review', icon: ShieldCheck },
  { href: '/precedents', label: 'IRS Precedents', icon: Search },
  { href: '/tax-estimate', label: 'Tax Estimate', icon: Calculator },
  { href: '/governance', label: 'Governance Log', icon: ClipboardList },
  { href: '/agents', label: 'Agent Status', icon: Bot },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
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

        {/* Client chip */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #BAE0F7' }}>
          <div className="text-xs font-medium mb-0.5" style={{ color: '#64748B' }}>Active Client</div>
          <div className="text-sm font-semibold" style={{ color: '#1E293B' }}>Sarah Chen</div>
          <div className="text-xs font-medium" style={{ color: '#0077C5' }}>Meridian Home Goods</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <div className="section-title px-3 mb-2">Navigation</div>
          <div className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>Intuit Virtual Expert Platform</div>
          <div className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>Prototype v1.0 · 2025</div>
        </div>
      </aside>
    </>
  );
}
