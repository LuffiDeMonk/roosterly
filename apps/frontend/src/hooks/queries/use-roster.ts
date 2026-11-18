import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import type { ShiftType, Assignment } from '@/types';
import { toast } from '@/components/ui/sonner';

export interface RosterWeekData {
  success: boolean;
  roster: {
    _id: string;
    teamId: string;
    startDate: string;
    endDate: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    version: number;
  } | null;
  shiftTypes: ShiftType[];
  members: any[];
  assignments: Assignment[];
}

export function useRosterQuery(teamId?: string, date?: string) {
  return useQuery<RosterWeekData>({
    queryKey: ['roster', teamId, date],
    queryFn: async () => {
      if (!teamId || !date) {
        throw new Error('teamId and date are required');
      }
      const res = await api.get(`/api/rosters/week?teamId=${teamId}&date=${date}`);
      return res.data;
    },
    enabled: !!teamId && !!date,
  });
}

export function usePublishRosterMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rosterId: string) => {
      const res = await api.post(`/api/rosters/${rosterId}/publish`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Roster published! Shift notifications dispatched to ward staff.');
        queryClient.invalidateQueries({ queryKey: ['roster', teamId] });
        queryClient.invalidateQueries({ queryKey: ['incharge', teamId] });
      } else {
        toast.error(data?.message || 'Failed to publish roster');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error publishing roster');
    },
  });
}
