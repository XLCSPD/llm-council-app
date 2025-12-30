import { ReactNode } from 'react';
import { IconSidebar } from './IconSidebar';
import { FloatingHeader } from './FloatingHeader';
import type { SessionSummary } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function MainLayout({ children, onNewSession, onSelectSession }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base bg-gradient-radial">
      {/* Icon Sidebar - 72px collapsed, 280px on hover */}
      <IconSidebar onNewSession={onNewSession} onSelectSession={onSelectSession} />

      {/* Floating Header */}
      <FloatingHeader />

      {/* Main Content Area */}
      <main className="ml-[72px] pt-24 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
