import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Sparkles, ShieldCheck, UserCheck } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      toast.success('Welcome back to Roosterly!');
      navigate({ to: '/roster' });
    } else {
      toast.error(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="container mx-auto max-w-md py-12 px-4 sm:px-6">
      <Card className="border border-border/80 shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-2 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Sign in to Roosterly</CardTitle>
          <CardDescription className="text-xs">
            Clinical workforce scheduling, shift rosters, and swap workflows
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-2">
            <Input
              label="Work Email Address"
              type="email"
              placeholder="name@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Quick Demo Fill Buttons */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-muted-foreground block mb-2">
                Quick Demo Accounts (Local / Seeded):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 justify-start px-2 font-normal"
                  onClick={() => fillDemoAccount('supervisor@roosterly.health')}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Supervisor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 justify-start px-2 font-normal"
                  onClick={() => fillDemoAccount('nurse.sarah@roosterly.health')}
                >
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  Staff Nurse
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" loading={submitting} className="w-full">
              Sign In
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
