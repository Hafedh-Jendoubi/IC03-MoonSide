import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import clsx from 'clsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main
          className={clsx(
            'flex-1 overflow-y-auto mt-16 lg:ml-64',
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
