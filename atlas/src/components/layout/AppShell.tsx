'use client';

import { useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';

const SidebarContext = createContext<{ open: () => void }>({ open: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open: () => setSidebarOpen(true) }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
