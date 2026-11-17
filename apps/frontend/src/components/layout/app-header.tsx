import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { TeamSwitcher } from './team-switcher';
import { UserNav } from './user-nav';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import { Calendar, Repeat, ShieldAlert, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppHeader: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isSupervisor } = useTeam();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { label: 'Weekly Roster', href: '/roster', icon: Calendar },
    { label: 'Shift Swaps', href: '/swaps', icon: Repeat },
    ...(isSupervisor ? [{ label: 'In-Charge Oversight', href: '/incharge', icon: ShieldAlert }] : []),
    { label: 'Ward Staff', href: '/team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Ward Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Roosterly
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden sm:block">
              <TeamSwitcher />
            </div>
          )}
        </div>

        {/* Center: Main Nav Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3">
          <UserNav />
        </div>
      </div>

      {/* Mobile Ward Switcher & Navigation bar */}
      {isAuthenticated && (
        <div className="border-t border-border/40 sm:hidden px-4 py-2 flex items-center justify-between bg-muted/20">
          <TeamSwitcher />
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  className={cn(
                    'p-2 rounded-lg text-xs font-medium transition-colors',
                    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
