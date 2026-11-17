import React, { useState } from 'react';
import { AppHeader } from './app-header';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JoinTeamDialog } from './join-team-dialog';
import { CreateTeamDialog } from './create-team-dialog';
import { Hospital, Plus, UserPlus } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { teams, isLoading: teamLoading } = useTeam();
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const hasNoTeams = isAuthenticated && !authLoading && !teamLoading && teams.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <AppHeader />

      {hasNoTeams && (
        <div className="container mx-auto px-4 pt-6">
          <Card className="border-dashed border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Hospital className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    You haven't joined a Clinical Ward or Department yet
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Join with a 6-character code from your supervisor, or create a new ward team to begin scheduling.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setShowJoin(true)} className="gap-1.5 text-xs">
                  <UserPlus className="h-3.5 w-3.5" />
                  Join with Code
                </Button>
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Create Ward
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="flex-1 pb-12">
        {children}
      </main>

      <JoinTeamDialog open={showJoin} onOpenChange={setShowJoin} />
      <CreateTeamDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};
