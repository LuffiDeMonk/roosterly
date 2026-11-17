import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import { LogOut, Shield, User } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const UserNav: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentRole, isSupervisor } = useTeam();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link to="/register">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || 'U'}`.toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {isSupervisor && (
        <Badge
          variant="outline"
          className="hidden md:flex items-center gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[10px] px-2 py-0.5"
        >
          <Shield className="h-3 w-3" />
          Supervisor
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full ring-1 ring-border/80 hover:ring-primary/40 focus:ring-2 focus:ring-primary"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-medium leading-none text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] leading-none text-muted-foreground truncate">
                {user.email}
              </p>
              <div className="pt-1">
                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold">
                  {currentRole || user.roles?.[0] || 'STAFF'}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/team" className="text-xs cursor-pointer gap-2">
              <User className="h-3.5 w-3.5" />
              Ward Staff Directory
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
