import { ReactNode } from 'react';
import { IconSidebar } from './IconSidebar';
import { FloatingHeader } from './FloatingHeader';
import { MobileNav } from './MobileNav';
import type { SessionSummary } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function MainLayout({ children, onNewSession, onSelectSession }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base bg-gradient-radial">
      {/* Mobile Navigation - hamburger menu, visible only on mobile */}
      <MobileNav onNewSession={onNewSession} onSelectSession={onSelectSession} />

      {/* Desktop Sidebar - 72px collapsed, 280px on hover, hidden on mobile */}
      <IconSidebar onNewSession={onNewSession} onSelectSession={onSelectSession} />

      {/* Floating Header */}
      <FloatingHeader />

      {/* Main Content Area - responsive margin for sidebar */}
      <main className="ml-0 md:ml-[72px] pt-20 md:pt-24 min-h-screen">
        <div className="px-4 py-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
