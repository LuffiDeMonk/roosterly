import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import {
  useSwapsQuery,
  useClaimSwapMutation,
  useReviewSwapMutation,
} from '@/hooks/queries/use-swaps';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Repeat,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Radio,
  RefreshCw,
} from 'lucide-react';
import type { SwapRequest } from '@/types';

export const Route = createFileRoute('/swaps')({
  component: SwapsPage,
});

export function SwapsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTeam, isSupervisor } = useTeam();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [activeTab, setActiveTab] = useState<'open' | 'my' | 'review'>('open');

  // TanStack Query & Mutations
  const {
    data: swaps = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useSwapsQuery(currentTeam?._id);

  const claimMutation = useClaimSwapMutation(currentTeam?._id);
  const reviewMutation = useReviewSwapMutation(currentTeam?._id);

  const handleClaim = (swapId: string) => {
    claimMutation.mutate(swapId);
  };

  const handleReview = (swapId: string, action: 'APPROVE' | 'REJECT') => {
    reviewMutation.mutate({ swapId, action });
  };

  if (!currentTeam) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
        <div className="p-8 border border-dashed rounded-2xl bg-card">
          <Repeat className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold">No Ward Selected</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Please select a clinical ward to manage shift swaps.
          </p>
        </div>
      </div>
    );
  }

  // Filter categorizations
  const openBroadcasts = swaps.filter(
    (s: SwapRequest) => s.type === 'BROADCAST' && s.status === 'OPEN'
  );

  const mySwaps = swaps.filter((s: SwapRequest) => {
    const reqId =
      typeof s.requesterId === 'object' ? (s.requesterId as any)._id : s.requesterId;
    const targetId =
      typeof s.targetEmployeeId === 'object'
        ? (s.targetEmployeeId as any)?._id
        : s.targetEmployeeId;
    return reqId === user?._id || targetId === user?._id;
  });

  const pendingSupervisorReview = swaps.filter(
    (s: SwapRequest) =>
      s.status === 'PENDING_APPROVAL' || (s.status === 'ACCEPTED' && isSupervisor)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
          >
            OPEN BROADCAST
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
          >
            PENDING IN-CHARGE
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="text-[10px] bg-emerald-600 text-white">
            APPROVED
          </Badge>
        );
      case 'REJECTED':
        return <Badge variant="destructive" className="text-[10px]">REJECTED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            3-Phase Shift Swaps & Trades
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ward-governed peer shift exchanges with atomic supervisor verification
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={loading || isFetching}
          title="Refresh Swaps"
          className="h-9 px-2.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="open" className="text-xs">
            Broadcasts ({openBroadcasts.length})
          </TabsTrigger>
          <TabsTrigger value="my" className="text-xs">
            My Swaps ({mySwaps.length})
          </TabsTrigger>
          {isSupervisor && (
            <TabsTrigger value="review" className="text-xs">
              Review Queue ({pendingSupervisorReview.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Open Broadcasts */}
        <TabsContent value="open" className="pt-4 space-y-3">
          {openBroadcasts.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-2">
                <Radio className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-sm font-semibold">No Open Broadcast Shifts</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  When a ward colleague needs coverage and posts an open broadcast, it will appear here for you to claim.
                </p>
              </CardContent>
            </Card>
          ) : (
            openBroadcasts.map((s) => {
              const reqUser = typeof s.requesterId === 'object' ? (s.requesterId as any) : null;
              const reqName = reqUser ? `${reqUser.firstName} ${reqUser.lastName}` : 'Ward Nurse';
              const isMyOwn = reqUser?._id === user?._id;

              return (
                <Card key={s._id} className="border border-border/80 shadow-2xs">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{reqName}</span>
                        {getStatusBadge(s.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.reason ? `"${s.reason}"` : 'Looking for shift coverage'}
                      </p>
                    </div>

                    {!isMyOwn && (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(s._id)}
                        loading={claimMutation.isPending && claimMutation.variables === s._id}
                        className="text-xs shrink-0"
                      >
                        Claim Shift
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 2: My Swaps */}
        <TabsContent value="my" className="pt-4 space-y-3">
          {mySwaps.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-2">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-sm font-semibold">No Personal Swaps Yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Shift trades you initiate or receive will be tracked here through peer acceptance and supervisor approval.
                </p>
              </CardContent>
            </Card>
          ) : (
            mySwaps.map((s) => (
              <Card key={s._id} className="border border-border/80 shadow-2xs">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {s.type === 'BROADCAST' ? 'Broadcast Shift' : 'Direct Peer Trade'}
                      </span>
                      {getStatusBadge(s.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(s.createdAt).toLocaleDateString()} • {s.reason || 'No reason provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 3: Supervisor Review Queue */}
        {isSupervisor && (
          <TabsContent value="review" className="pt-4 space-y-3">
            {pendingSupervisorReview.length === 0 ? (
              <Card className="text-center py-12 border-dashed">
                <CardContent className="space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto opacity-60" />
                  <h3 className="text-sm font-semibold">Review Queue Clear</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    All peer-accepted shift trades have been reviewed. New claims requiring in-charge signoff will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingSupervisorReview.map((s) => {
                const reqUser = typeof s.requesterId === 'object' ? (s.requesterId as any) : null;
                const targetUser = typeof s.targetEmployeeId === 'object' ? (s.targetEmployeeId as any) : null;
                const isReviewing =
                  reviewMutation.isPending && reviewMutation.variables?.swapId === s._id;

                return (
                  <Card key={s._id} className="border border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10 shadow-2xs">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {reqUser?.firstName} {reqUser?.lastName} ↔ {targetUser?.firstName} {targetUser?.lastName}
                          </span>
                          {getStatusBadge(s.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reason: {s.reason || 'Mutual peer agreement'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(s._id, 'REJECT')}
                          loading={isReviewing && reviewMutation.variables?.action === 'REJECT'}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReview(s._id, 'APPROVE')}
                          loading={isReviewing && reviewMutation.variables?.action === 'APPROVE'}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Approve Swap
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
