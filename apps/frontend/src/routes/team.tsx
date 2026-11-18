import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import {
  useTeamMembersQuery,
  useUpdateMemberStatusMutation,
} from '@/hooks/queries/use-team-members';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import {
  Users,
  Copy,
  Check,
  UserCheck,
  UserX,
  Shield,
  Hospital,
  RefreshCw,
} from 'lucide-react';
import type { Membership } from '@/types';

export const Route = createFileRoute('/team')({
  component: TeamPage,
});

export function TeamPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTeam, isSupervisor } = useTeam();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [copied, setCopied] = useState(false);

  // TanStack Query & Mutation
  const {
    data: members = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useTeamMembersQuery(currentTeam?._id);

  const statusMutation = useUpdateMemberStatusMutation(currentTeam?._id);

  const handleCopyCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCopied(true);
      toast.success(`Copied invite code "${currentTeam.code}" to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusUpdate = (memberId: string, status: 'ACTIVE' | 'REJECTED') => {
    statusMutation.mutate({ memberId, status });
  };

  if (!currentTeam) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
        <div className="p-8 border border-dashed rounded-2xl bg-card">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold">No Ward Selected</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Please select a clinical ward from the top menu to view staff members.
          </p>
        </div>
      </div>
    );
  }

  const activeMembers = members.filter((m: Membership) => m.status === 'ACTIVE');
  const pendingMembers = members.filter((m: Membership) => m.status === 'PENDING');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner with Ward Code */}
      <Card className="border border-border/80 shadow-xs bg-gradient-to-r from-card to-muted/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Hospital className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-lg font-bold text-foreground">{currentTeam.name}</h1>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {currentTeam.tier} Tier
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTeam.department ? `${currentTeam.department} • ` : ''}
              {activeMembers.length} active members of {currentTeam.maxMembers} maximum
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="p-2.5 px-3 rounded-xl border border-border bg-background flex items-center justify-between gap-3 w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Ward Invite Code
                </span>
                <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                  {currentTeam.code}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopyCode}
                title="Copy Code"
                className="hover:bg-muted"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              loading={loading || isFetching}
              title="Refresh Members"
              className="h-10 px-3 self-stretch sm:self-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Join Requests (Supervisors only) */}
      {isSupervisor && pendingMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Pending Join Requests ({pendingMembers.length})
          </h2>
          <div className="space-y-2">
            {pendingMembers.map((member: Membership) => {
              const u = member.user || (member as any).userId;
              const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Prospective Staff';
              const email = u?.email || 'No email';
              const isUpdating =
                statusMutation.isPending && statusMutation.variables?.memberId === member._id;

              return (
                <Card key={member._id} className="border border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs font-semibold bg-amber-500/10 text-amber-700">
                          {name[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{name}</h4>
                        <p className="text-[11px] text-muted-foreground">{email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(member._id, 'REJECTED')}
                        loading={isUpdating && statusMutation.variables?.status === 'REJECTED'}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(member._id, 'ACTIVE')}
                        loading={isUpdating && statusMutation.variables?.status === 'ACTIVE'}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Staff Directory */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Active Ward Staff ({activeMembers.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeMembers.map((member: Membership) => {
            const u = member.user || (member as any).userId;
            const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Staff Member';
            const email = u?.email || 'No email';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={member._id} className="border border-border/80 shadow-2xs">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground truncate">{name}</h4>
                      <Badge
                        variant={member.role === 'SUPERVISOR' || member.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="text-[9px] uppercase px-1.5 py-0"
                      >
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{email}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
