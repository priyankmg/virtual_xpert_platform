'use client';

import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useSidebar } from './AppShell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const { open } = useSidebar();

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b sticky top-0 z-20"
      style={{ background: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={open}
          className="lg:hidden flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} style={{ color: '#64748B' }} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold truncate" style={{ color: '#1E293B' }}>{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: '#94A3B8' }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {action && <div className="hidden sm:flex">{action}</div>}

        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={18} style={{ color: '#64748B' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-1 ring-white" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#0077C5' }}>
            SC
          </div>
          <span className="text-sm font-medium hidden md:inline" style={{ color: '#1E293B' }}>Sarah Chen</span>
          <ChevronDown size={13} style={{ color: '#94A3B8' }} />
        </div>
      </div>

      {/* Mobile: show action inline below title on xs if hidden above */}
      {action && (
        <div className="sm:hidden absolute top-full left-0 right-0 px-4 pb-2 border-b" style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}>
          {action}
        </div>
      )}
    </header>
  );
}
