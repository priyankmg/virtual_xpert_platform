'use client';

import Link from 'next/link';
import { Building2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSelectedClient } from '@/components/layout/AppShell';

interface ClientBannerProps {
  /** Override the default "Meridian Home Goods" fallback */
  fallbackName?: string;
}

export default function ClientBanner({ fallbackName = 'Meridian Home Goods' }: ClientBannerProps) {
  const { selectedClient } = useSelectedClient();
  const name = selectedClient?.clientName ?? fallbackName;
  const entity = selectedClient?.entityType ?? 'S-Corp';
  const topic = selectedClient?.sessionTopic;
  const pendingActions = 3; // could come from context/props in a fuller implementation

  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-2.5 border-b border-[var(--border-color)] bg-[var(--intuit-blue-light)] flex-wrap">
      <Building2 size={14} className="text-[var(--intuit-blue)] shrink-0" />
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 text-sm">
        <span className="text-[var(--text-muted)]">Viewing data for</span>
        <span className="font-semibold text-[var(--intuit-blue)]">{name}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-[var(--text-secondary)]">{entity}</span>
        {topic && (
          <>
            <span className="text-[var(--text-muted)] hidden sm:inline">·</span>
            <span className="text-[var(--text-secondary)] hidden sm:inline truncate max-w-xs">{topic}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {pendingActions > 0 && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <AlertTriangle size={10} />
            {pendingActions} pending
          </span>
        )}
        <Link
          href="/financial-snapshot"
          className="text-xs text-[var(--intuit-blue)] hover:underline flex items-center gap-0.5"
        >
          Financial data <ChevronRight size={11} />
        </Link>
      </div>
    </div>
  );
}
