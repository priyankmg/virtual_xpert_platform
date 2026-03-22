import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import AssistantPanel from '@/components/agents/AssistantPanel';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Atlas — Virtual Expert Platform',
  description: 'Multi-Agent AI Platform for credentialed tax experts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
        <AssistantPanel clientId="CLIENT-001" />
      </body>
    </html>
  );
}
