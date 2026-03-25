'use client';

import React from 'react';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar } from '@/components/ui/Avatar';
import clsx from 'clsx';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6 lg:left-64 z-50">
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder-neutral-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-foreground" />
        </button>
        
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>

        <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors">
          <Avatar size="sm" initials="JD" />
        </button>
      </div>
    </header>
  );
}
