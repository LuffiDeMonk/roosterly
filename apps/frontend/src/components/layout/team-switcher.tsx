import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeam } from '@/context/team-context';
import { JoinTeamDialog } from './join-team-dialog';
import { CreateTeamDialog } from './create-team-dialog';
import { Check, ChevronDown, Copy, Hospital, Plus, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

export const TeamSwitcher: React.FC = () => {
  const { teams, currentTeam, selectTeamById } = useTeam();
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCopied(true);
      toast.success(`Copied code "${currentTeam.code}" to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 border-border/80 bg-background/50 hover:bg-muted/70 text-left font-normal"
            >
              <Hospital className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col items-start leading-none truncate max-w-[140px] sm:max-w-[200px]">
                <span className="font-semibold text-xs text-foreground truncate">
                  {currentTeam ? currentTeam.name : 'Select Ward / Team'}
                </span>
                {currentTeam?.department && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentTeam.department}
                  </span>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-70 ml-1 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Clinical Wards & Units
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {teams.length === 0 ? (
              <div className="px-2 py-3 text-xs text-center text-muted-foreground">
                No wards joined yet
              </div>
            ) : (
              teams.map((team) => (
                <DropdownMenuItem
                  key={team._id}
                  onClick={() => selectTeamById(team._id)}
                  className="flex items-center justify-between text-xs cursor-pointer py-2"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-medium text-foreground truncate">{team.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Code: {team.code}
                    </span>
                  </div>
                  {currentTeam?._id === team._id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowJoin(true)}
              className="text-xs cursor-pointer gap-2"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Join Ward with Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowCreate(true)}
              className="text-xs cursor-pointer gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Ward
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentTeam?.code && (
          <Badge
            variant="secondary"
            onClick={handleCopyCode}
            title="Click to copy team invite code"
            className="cursor-pointer font-mono text-[11px] px-2 py-0.5 tracking-wider hidden sm:flex items-center gap-1 hover:bg-secondary/80 active:scale-95 transition-all"
          >
            {currentTeam.code}
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </Badge>
        )}
      </div>

      <JoinTeamDialog open={showJoin} onOpenChange={setShowJoin} />
      <CreateTeamDialog open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
};
