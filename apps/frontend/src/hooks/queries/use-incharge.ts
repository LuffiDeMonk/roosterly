import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import type { CoverageSlot } from '@/types';

export interface InChargeData {
  coverage: CoverageSlot[];
  pendingSwapsCount: number;
  pendingMembersCount: number;
}

export function useInChargeQuery(teamId?: string, date?: string) {
  return useQuery<InChargeData>({
    queryKey: ['incharge', teamId, date],
    queryFn: async () => {
      if (!teamId || !date) {
        throw new Error('teamId and date are required');
      }
      const [covRes, pendingRes] = await Promise.all([
        api.get(`/api/incharge/coverage?teamId=${teamId}&date=${date}`),
        api.get(`/api/incharge/pending-actions?teamId=${teamId}`),
      ]);

      return {
        coverage: covRes.data?.coverage || [],
        pendingSwapsCount: pendingRes.data?.pendingSwapsCount || 0,
        pendingMembersCount: pendingRes.data?.pendingMembersCount || 0,
      };
    },
    enabled: !!teamId && !!date,
  });
}
