import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Sparkles, Building2, UserPlus } from 'lucide-react';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinMode, setJoinMode] = useState<'CODE' | 'NEW_ORG'>('CODE');
  const [teamCode, setTeamCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    const res = await register({
      firstName,
      lastName,
      email,
      password,
      teamCode: joinMode === 'CODE' && teamCode.trim() ? teamCode.trim().toUpperCase() : undefined,
      orgName: joinMode === 'NEW_ORG' && orgName.trim() ? orgName.trim() : undefined,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success('Account created successfully! Welcome to Roosterly.');
      navigate({ to: '/roster' });
    } else {
      toast.error(res.message || 'Registration failed');
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-10 px-4 sm:px-6">
      <Card className="border border-border/80 shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-2 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Create your Roosterly Account</CardTitle>
          <CardDescription className="text-xs">
            Join your clinical ward or set up a new shift-based healthcare team
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Jenkins"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Work Email Address"
              type="email"
              placeholder="sarah.jenkins@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {/* Toggle Join Mode */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-muted-foreground block mb-2">
                Hospital / Organization Setup:
              </span>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  type="button"
                  variant={joinMode === 'CODE' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5 justify-center font-normal"
                  onClick={() => setJoinMode('CODE')}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Join with Ward Code
                </Button>
                <Button
                  type="button"
                  variant={joinMode === 'NEW_ORG' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5 justify-center font-normal"
                  onClick={() => setJoinMode('NEW_ORG')}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Create Hospital / Org
                </Button>
              </div>

              {joinMode === 'CODE' ? (
                <Input
                  label="6-Character Ward Code (Optional)"
                  placeholder="e.g. ED4B92"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono tracking-widest uppercase"
                  helperText="Leave empty if you wish to join a ward later."
                />
              ) : (
                <Input
                  label="Hospital / Organization Name"
                  placeholder="e.g. St. Jude Regional Medical Center"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required={joinMode === 'NEW_ORG'}
                />
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" loading={submitting} className="w-full">
              Create Account
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
