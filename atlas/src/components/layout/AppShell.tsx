'use client';

import { useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import WhatsNewModal from '@/components/ui/WhatsNewModal';

// ── Sidebar context ────────────────────────────────────────────────────────────
const SidebarContext = createContext<{ open: () => void }>({ open: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

// ── Client context ─────────────────────────────────────────────────────────────
export interface SelectedClient {
  clientId: string;
  clientName: string;
  entityType: string;
  sessionId?: string;
  sessionTopic?: string;
  briefStatus?: 'NOT_STARTED' | 'BRIEF_COMPLETE' | 'IN_PROGRESS' | 'COMPLETED';
}

interface ClientContextType {
  selectedClient: SelectedClient | null;
  setSelectedClient: (c: SelectedClient | null) => void;
}

const ClientContext = createContext<ClientContextType>({
  selectedClient: null,
  setSelectedClient: () => {},
});

export function useSelectedClient() {
  return useContext(ClientContext);
}

// ── AppShell ───────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>({
    clientId: 'CLIENT-001',
    clientName: 'Meridian Home Goods',
    entityType: 'S-Corp',
    sessionId: 'sess-004',
    sessionTopic: 'Q4 tax readiness review',
    briefStatus: 'IN_PROGRESS',
  });

  return (
    <SidebarContext.Provider value={{ open: () => setSidebarOpen(true) }}>
      <ClientContext.Provider value={{ selectedClient, setSelectedClient }}>
        <WhatsNewModal />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          {children}
        </div>
      </ClientContext.Provider>
    </SidebarContext.Provider>
  );
}
