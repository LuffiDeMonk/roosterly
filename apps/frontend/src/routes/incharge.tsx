import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useTeam } from '@/context/team-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Repeat,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import type { CoverageSlot } from '@/types';

export const Route = createFileRoute('/incharge')({
  component: InChargePage,
});

export function InChargePage() {
  const { currentTeam } = useTeam();
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [coverageSlots, setCoverageSlots] = useState<CoverageSlot[]>([]);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [pendingMembers, setPendingMembers] = useState(0);

  const fetchOversight = useCallback(async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const [covRes, pendingRes] = await Promise.all([
        api.get(`/api/incharge/coverage?teamId=${currentTeam._id}&date=${dateStr}`),
        api.get(`/api/incharge/pending-actions?teamId=${currentTeam._id}`),
      ]);

      if (covRes.data?.success) {
        setCoverageSlots(covRes.data.coverage || []);
      }
      if (pendingRes.data?.success) {
        setPendingSwaps(pendingRes.data.pendingSwapsCount || 0);
        setPendingMembers(pendingRes.data.pendingMembersCount || 0);
      }
    } catch (err) {
      console.error('Failed to load in-charge metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTeam?._id, dateStr]);

  useEffect(() => {
    fetchOversight();
  }, [fetchOversight]);

  if (!currentTeam) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
        <div className="p-8 border border-dashed rounded-2xl bg-card">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold">No Ward Selected</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Please select a clinical ward from the top menu to view staffing ratios.
          </p>
        </div>
      </div>
    );
  }

  const hasUnderstaffing = coverageSlots.some((s) => s.isUnderstaffed);

  const getShiftIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('morning') || lower.includes('day')) return <Sun className="h-4 w-4 text-amber-500" />;
    if (lower.includes('evening')) return <Sunset className="h-4 w-4 text-orange-500" />;
    return <Moon className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            In-Charge Unit Oversight & Staffing Ratios
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time coverage vs required minimum nurse-to-patient staffing targets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button variant="outline" size="sm" onClick={fetchOversight} loading={loading} className="h-9">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Safety Alert Banner */}
      {hasUnderstaffing ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-950/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-destructive">
              Understaffing Warning for {dateStr}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              One or more shifts do not meet the minimum staffing threshold. Broadcast an open shift or contact on-call nurses.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Optimal Coverage Confirmed
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All scheduled shifts meet or exceed ward staffing guidelines for {dateStr}.
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coverageSlots.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No active shift templates configured for this ward yet.
          </div>
        ) : (
          coverageSlots.map((slot) => {
            const percentage = Math.min(Math.round((slot.assignedCount / (slot.targetCount || 1)) * 100), 100);
            return (
              <Card key={slot.shiftTypeId} className="border border-border/80 shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getShiftIcon(slot.shiftName)}
                      <CardTitle className="text-sm font-semibold">{slot.shiftName}</CardTitle>
                    </div>
                    <Badge
                      variant={slot.isUnderstaffed ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {slot.assignedCount} / {slot.targetCount} Required
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Code: <span className="font-bold">{slot.shortCode}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all rounded-full ${
                        slot.isUnderstaffed ? 'bg-destructive' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Coverage: {percentage}%</span>
                    <span>{slot.isUnderstaffed ? 'Short by ' + (slot.targetCount - slot.assignedCount) : 'Fully Staffed'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Action Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Shift Swaps</p>
                <h3 className="text-lg font-bold text-foreground">{pendingSwaps}</h3>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Awaiting Sign-off</Badge>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Ward Join Requests</p>
                <h3 className="text-lg font-bold text-foreground">{pendingMembers}</h3>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Pending Review</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
