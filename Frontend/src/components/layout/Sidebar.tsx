'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Home,
  Users,
  MessageSquare,
  Briefcase,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/network', label: 'Network', icon: Users },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/groups', label: 'Groups', icon: Briefcase },
  { href: '/dashboard/learning', label: 'Learning', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border/40 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
            C
          </div>
          <span className="font-bold text-lg text-foreground">Connect</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 space-y-2">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all duration-200 font-medium text-sm"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span>Settings</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error/70 hover:text-error hover:bg-error/10 transition-all duration-200 font-medium text-sm">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
