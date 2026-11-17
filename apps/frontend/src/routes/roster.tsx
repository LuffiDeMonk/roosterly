import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useTeam } from '@/context/team-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Send,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { ShiftType, Assignment } from '@/types';

export const Route = createFileRoute('/roster')({
  component: RosterPage,
});

interface MemberRow {
  userId: string;
  name: string;
  role: string;
  assignments: Record<string, Assignment>; // date -> assignment
}

export function RosterPage() {
  const { currentTeam, isSupervisor } = useTeam();

  // Anchor to current Monday
  const [currentMonday, setCurrentMonday] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [loading, setLoading] = useState(false);
  const [rosterId, setRosterId] = useState<string | null>(null);
  const [rosterStatus, setRosterStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Compute 7 days of the week starting from currentMonday
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDateYMD = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const fetchRoster = useCallback(async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const dateStr = formatDateYMD(currentMonday);
      const res = await api.get(`/api/rosters/week?teamId=${currentTeam._id}&date=${dateStr}`);

      if (res.data?.success) {
        setRosterId(res.data.roster?._id || null);
        setRosterStatus(res.data.roster?.status || 'DRAFT');

        const fetchedShiftTypes: ShiftType[] = res.data.shiftTypes || [];
        setShiftTypes(fetchedShiftTypes);

        const fetchedMembers = res.data.members || [];
        const fetchedAssignments: Assignment[] = res.data.assignments || [];

        // Build grid rows
        const rows: MemberRow[] = fetchedMembers.map((m: any) => {
          const userObj = m.user || m.userId;
          const uId = userObj?._id || m.userId;
          const name = userObj ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() : 'Staff Member';

          const memberAssignments: Record<string, Assignment> = {};
          fetchedAssignments.forEach((a) => {
            const aEmpId = typeof a.employeeId === 'object' ? (a.employeeId as any)._id : a.employeeId;
            if (aEmpId === uId) {
              const aDate = typeof a.date === 'string' ? a.date.split('T')[0] : '';
              memberAssignments[aDate] = a;
            }
          });

          return {
            userId: uId,
            name: name || 'Nurse',
            role: m.role,
            assignments: memberAssignments,
          };
        });

        setMembers(rows);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTeam?._id, currentMonday]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const prevWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const nextWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const currentWeekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const handlePublish = async () => {
    if (!rosterId) {
      toast.error('No draft roster created yet');
      return;
    }
    setPublishing(true);
    try {
      const res = await api.post(`/api/rosters/${rosterId}/publish`);
      if (res.data?.success) {
        toast.success('Roster published! Shift notifications dispatched to ward staff.');
        setRosterStatus('PUBLISHED');
      } else {
        toast.error(res.data?.message || 'Failed to publish roster');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error publishing roster');
    } finally {
      setPublishing(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
        <div className="p-8 border border-dashed rounded-2xl bg-card">
          <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold">No Ward Selected</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Please join or select a clinical ward from the top menu to view the weekly roster.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {currentTeam.name}
            </h1>
            <Badge
              variant={rosterStatus === 'PUBLISHED' ? 'default' : 'secondary'}
              className="text-[10px] uppercase font-semibold"
            >
              {rosterStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Weekly 7-Day Shift Matrix • Monday to Sunday
          </p>
        </div>

        {/* Date Navigator & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-border rounded-xl bg-card shadow-xs">
            <Button variant="ghost" size="icon-sm" onClick={prevWeek} title="Previous Week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs font-medium text-foreground select-none whitespace-nowrap">
              {currentWeekLabel}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={nextWeek} title="Next Week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoster}
            loading={loading}
            title="Refresh Roster"
            className="h-9 px-2.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {isSupervisor && (
            <Button
              size="sm"
              onClick={handlePublish}
              loading={publishing}
              disabled={rosterStatus === 'PUBLISHED'}
              className="h-9 text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {rosterStatus === 'PUBLISHED' ? 'Published' : 'Publish Roster'}
            </Button>
          )}
        </div>
      </div>

      {/* Roster Matrix Table */}
      <Card className="overflow-hidden border border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4 w-48 sticky left-0 bg-muted/90 backdrop-blur-xs z-10 font-semibold text-foreground">
                  Staff Member
                </th>
                {weekDates.map((date, idx) => {
                  const isToday =
                    new Date().toISOString().split('T')[0] === formatDateYMD(date);
                  return (
                    <th
                      key={idx}
                      className={`py-3 px-3 min-w-[110px] text-center border-l border-border/60 ${
                        isToday ? 'bg-primary/5 text-primary font-bold' : ''
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wide">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No active members in this ward yet. Share the code{' '}
                    <span className="font-mono font-bold text-foreground">
                      {currentTeam.code}
                    </span>{' '}
                    with staff to populate the schedule.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.userId}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 sticky left-0 bg-background/95 backdrop-blur-xs z-10 border-r border-border/40 font-medium text-foreground">
                      <div className="truncate max-w-[170px]">{member.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {member.role}
                      </div>
                    </td>

                    {weekDates.map((date, idx) => {
                      const dateKey = formatDateYMD(date);
                      const assignment = member.assignments[dateKey];
                      const shift =
                        assignment && typeof assignment.shiftTypeId === 'object'
                          ? (assignment.shiftTypeId as ShiftType)
                          : shiftTypes.find((s) => s._id === assignment?.shiftTypeId);

                      return (
                        <td
                          key={idx}
                          className="py-2.5 px-2 text-center border-l border-border/40 align-middle"
                        >
                          {shift ? (
                            <div
                              className="inline-flex flex-col items-center justify-center rounded-lg px-2 py-1 shadow-2xs transition-all hover:scale-105 cursor-default text-[11px] font-semibold w-full max-w-[90px]"
                              style={{
                                backgroundColor: shift.colorBg || '#E0F2FE',
                                color: shift.colorText || '#0369A1',
                              }}
                              title={`${shift.name} (${shift.startTime} – ${shift.endTime})`}
                            >
                              <span>{shift.shortCode}</span>
                              <span className="text-[9px] opacity-80 font-normal">
                                {shift.startTime}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40 font-mono">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Shift Types Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border/60">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Shift Templates:</span>
          {shiftTypes.length > 0 ? (
            shiftTypes.map((st) => (
              <div
                key={st._id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px]"
                style={{
                  backgroundColor: st.colorBg || '#F1F5F9',
                  color: st.colorText || '#0F172A',
                }}
              >
                <span className="font-bold">{st.shortCode}</span>
                <span>{st.name}</span>
                <span className="opacity-75">
                  ({st.startTime}–{st.endTime})
                </span>
              </div>
            ))
          ) : (
            <span>No shift templates defined for this ward.</span>
          )}
        </div>

        <div className="text-[11px]">
          Ward Code: <span className="font-mono font-bold text-foreground">{currentTeam.code}</span>
        </div>
      </div>
    </div>
  );
}
