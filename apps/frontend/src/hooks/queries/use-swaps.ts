import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import type { SwapRequest } from '@/types';
import { toast } from '@/components/ui/sonner';

export function useSwapsQuery(teamId?: string) {
  return useQuery<SwapRequest[]>({
    queryKey: ['swaps', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const res = await api.get(`/api/swaps?teamId=${teamId}`);
      return res.data?.swaps || [];
    },
    enabled: !!teamId,
  });
}

export function useClaimSwapMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      const res = await api.post(`/api/swaps/${swapId}/accept`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Shift claim submitted! Awaiting supervisor approval.');
        queryClient.invalidateQueries({ queryKey: ['swaps', teamId] });
        queryClient.invalidateQueries({ queryKey: ['incharge', teamId] });
      } else {
        toast.error(data?.message || 'Failed to claim shift');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error claiming shift');
    },
  });
}

export function useReviewSwapMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ swapId, action }: { swapId: string; action: 'APPROVE' | 'REJECT' }) => {
      const res = await api.post(`/api/swaps/${swapId}/review`, { action });
      return { data: res.data, action };
    },
    onSuccess: ({ data, action }) => {
      if (data?.success) {
        toast.success(
          action === 'APPROVE'
            ? 'Shift swap approved! Schedule updated atomically.'
            : 'Shift swap rejected.'
        );
        queryClient.invalidateQueries({ queryKey: ['swaps', teamId] });
        queryClient.invalidateQueries({ queryKey: ['roster', teamId] });
        queryClient.invalidateQueries({ queryKey: ['incharge', teamId] });
      } else {
        toast.error(data?.message || 'Review failed');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error reviewing swap');
    },
  });
}
