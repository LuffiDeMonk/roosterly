import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import type { Membership } from '@/types';
import { toast } from '@/components/ui/sonner';

export function useTeamMembersQuery(teamId?: string) {
  return useQuery<Membership[]>({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const res = await api.get(`/api/teams/${teamId}/members`);
      return res.data?.members || [];
    },
    enabled: !!teamId,
  });
}

export function useUpdateMemberStatusMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      status,
    }: {
      memberId: string;
      status: 'ACTIVE' | 'REJECTED';
    }) => {
      const res = await api.patch(`/api/teams/${teamId}/members/${memberId}`, { status });
      return { data: res.data, status };
    },
    onSuccess: ({ data, status }) => {
      if (data?.success) {
        toast.success(
          status === 'ACTIVE'
            ? 'Member approved into ward team!'
            : 'Join request rejected.'
        );
        queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        queryClient.invalidateQueries({ queryKey: ['roster', teamId] });
        queryClient.invalidateQueries({ queryKey: ['incharge', teamId] });
      } else {
        toast.error(data?.message || 'Failed to update member status');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error updating member');
    },
  });
}
