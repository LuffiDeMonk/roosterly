import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTeam } from '@/context/team-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Repeat,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Hospital,
  Activity,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const { isAuthenticated } = useAuth();
  const { currentTeam } = useTeam();
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data: { message?: string }) => setBackendStatus(data.message || 'Running'))
      .catch((err: unknown) => {
        console.error('ERROR:', err);
        setBackendStatus('Backend unreachable');
      });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Healthcare Workforce Scheduling & Shift Management</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Calm, Intentional Rostering for Clinical Teams
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Multi-tenant ward scheduling with 7-day weekly matrix views, 3-phase atomic shift swaps, and real-time nurse-to-patient staffing ratio safeguards.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {isAuthenticated ? (
            <>
              <Link to="/roster">
                <Button className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Open Weekly Roster
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/swaps">
                <Button variant="outline" className="gap-2">
                  <Repeat className="h-4 w-4" />
                  Shift Swaps
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button className="gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline">
                  Join Ward / Create Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Connectivity & Ward Context Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground font-medium">Backend Service:</span>
          <Badge
            variant={backendStatus.toLowerCase().includes('running') ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {backendStatus}
          </Badge>
        </div>

        {isAuthenticated && currentTeam && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hospital className="h-4 w-4 text-emerald-600" />
            <span>Active Ward:</span>
            <span className="font-semibold text-foreground">{currentTeam.name}</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {currentTeam.code}
            </Badge>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border/70 shadow-2xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">7-Day Weekly Matrix</CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Monday-anchored rosters with draft and published states, employee shift assignments, and instant week navigation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-border/70 shadow-2xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Repeat className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">3-Phase Atomic Shift Swaps</CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Direct trades and open broadcast claims executed with transactional Mongoose integrity upon supervisor approval.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-border/70 shadow-2xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">In-Charge Staffing Oversight</CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Shift-by-shift nurse-to-patient ratio monitoring with understaffing alerts for Morning, Evening, and Night shifts.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-border/70 shadow-2xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">Multi-Tenant Ward Teams</CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Unambiguous 6-character invite codes, supervisor member approvals, and strict departmental boundary enforcement.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
