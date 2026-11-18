import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/api/axios';
import { useAuth } from './auth-context';
import type { Team, MembershipRole } from '@/types';

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  currentRole: MembershipRole | null;
  isSupervisor: boolean;
  isLoading: boolean;
  setCurrentTeam: (team: Team | null) => void;
  selectTeamById: (teamId: string) => void;
  joinTeamByCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  createTeam: (name: string, department?: string) => Promise<{ success: boolean; team?: Team; message?: string }>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const ACTIVE_TEAM_KEY = 'roosterly_active_team_id';

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, memberships, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshTeams = useCallback(async () => {
    if (!isAuthenticated) {
      setTeams([]);
      setCurrentTeam(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get('/api/teams');
      const fetchedTeams: Team[] =
        (Array.isArray(res.data?.teams) && res.data.teams) ||
        (Array.isArray(res.data?.memberships) &&
          res.data.memberships
            .map((m: any) => m.teamId)
            .filter((t: any) => t && typeof t === 'object' && t._id)) ||
        [];

      setTeams(fetchedTeams);

      if (fetchedTeams.length > 0) {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_TEAM_KEY) : null;
        const match = fetchedTeams.find((t) => t._id === storedId) || fetchedTeams[0];
        setCurrentTeam(match);
        if (typeof window !== 'undefined') {
          localStorage.setItem(ACTIVE_TEAM_KEY, match._id);
        }
      } else {
        setCurrentTeam(null);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams, memberships]);

  const selectTeamById = (teamId: string) => {
    const found = teams.find((t) => t._id === teamId);
    if (found) {
      setCurrentTeam(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_TEAM_KEY, found._id);
      }
    }
  };

  const handleSetCurrentTeam = (team: Team | null) => {
    setCurrentTeam(team);
    if (typeof window !== 'undefined') {
      if (team) {
        localStorage.setItem(ACTIVE_TEAM_KEY, team._id);
      } else {
        localStorage.removeItem(ACTIVE_TEAM_KEY);
      }
    }
  };

  const joinTeamByCode = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.post('/api/teams/join', { code: code.trim().toUpperCase() });
      if (res.data?.team || res.data?.membership || res.data?.success) {
        await refreshTeams();
        return { success: true, message: res.data.message || 'Joined ward team successfully' };
      }
      return { success: false, message: res.data?.message || 'Failed to join ward team' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message || 'Error joining ward team' };
    }
  };

  const createTeam = async (
    name: string,
    department?: string
  ): Promise<{ success: boolean; team?: Team; message?: string }> => {
    try {
      const res = await api.post('/api/teams', { name, department });
      const newTeam = res.data?.team;
      if (newTeam) {
        await refreshTeams();
        handleSetCurrentTeam(newTeam);
        return { success: true, team: newTeam, message: res.data?.message || 'Ward team created successfully' };
      }
      return { success: false, message: res.data?.message || 'Failed to create ward team' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message || 'Error creating ward team' };
    }
  };

  // Determine current role in active team
  const activeMembership = memberships.find((m) => m.teamId === currentTeam?._id);
  const currentRole: MembershipRole | null = activeMembership?.role || null;

  // Check supervisor status from team membership or global user roles
  const isSupervisor =
    currentRole === 'SUPERVISOR' ||
    currentRole === 'ADMIN' ||
    Boolean(user?.roles?.some((r) => ['SUPERVISOR', 'ORG_ADMIN', 'PLATFORM_ADMIN'].includes(r)));

  return (
    <TeamContext.Provider
      value={{
        teams,
        currentTeam,
        currentRole,
        isSupervisor,
        isLoading,
        setCurrentTeam: handleSetCurrentTeam,
        selectTeamById,
        joinTeamByCode,
        createTeam,
        refreshTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
