import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { Sparkles, Building2, UserPlus } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      joinMode: 'CODE',
      teamCode: '',
      organizationName: '',
    },
  });

  const joinMode = form.watch('joinMode');

  const onSubmit = async (values: RegisterFormValues) => {
    const res = await register({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      teamCode: values.joinMode === 'CODE' && values.teamCode ? values.teamCode.trim().toUpperCase() : undefined,
      organizationName: values.joinMode === 'NEW_ORG' && values.organizationName ? values.organizationName.trim() : undefined,
      orgName: values.joinMode === 'NEW_ORG' && values.organizationName ? values.organizationName.trim() : undefined,
    });

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sarah" autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jenkins" autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="sarah.jenkins@hospital.org"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
                    onClick={() => form.setValue('joinMode', 'CODE')}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Join with Ward Code
                  </Button>
                  <Button
                    type="button"
                    variant={joinMode === 'NEW_ORG' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs gap-1.5 justify-center font-normal"
                    onClick={() => form.setValue('joinMode', 'NEW_ORG')}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Create Hospital / Org
                  </Button>
                </div>

                {joinMode === 'CODE' ? (
                  <FormField
                    control={form.control}
                    name="teamCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-Character Ward Code (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. ED4B92"
                            maxLength={6}
                            className="font-mono tracking-widest uppercase"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty if you wish to join a ward later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital / Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. St. Jude Regional Medical Center"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                className="w-full"
              >
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
        </Form>
      </Card>
    </div>
  );
}
