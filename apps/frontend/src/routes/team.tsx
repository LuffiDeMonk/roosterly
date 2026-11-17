import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useTeam } from '@/context/team-context';
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
  const { currentTeam, isSupervisor } = useTeam();
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/teams/${currentTeam._id}/members`);
      if (res.data?.success && Array.isArray(res.data.members)) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTeam?._id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCopyCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCopied(true);
      toast.success(`Copied invite code "${currentTeam.code}" to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusUpdate = async (memberId: string, status: 'ACTIVE' | 'REJECTED') => {
    if (!currentTeam?._id) return;
    setActionLoading(memberId);
    try {
      const res = await api.patch(`/api/teams/${currentTeam._id}/members/${memberId}`, { status });
      if (res.data?.success) {
        toast.success(
          status === 'ACTIVE'
            ? 'Member approved into ward team!'
            : 'Join request rejected.'
        );
        fetchMembers();
      } else {
        toast.error(res.data?.message || 'Failed to update member status');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating member');
    } finally {
      setActionLoading(null);
    }
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

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const pendingMembers = members.filter((m) => m.status === 'PENDING');

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
              onClick={fetchMembers}
              loading={loading}
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
            {pendingMembers.map((member) => {
              const u = member.user || (member as any).userId;
              const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Prospective Staff';
              const email = u?.email || 'No email';

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
                        loading={actionLoading === member._id}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(member._id, 'ACTIVE')}
                        loading={actionLoading === member._id}
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
          {activeMembers.map((member) => {
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
