import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTeam } from '@/context/team-context';
import { toast } from '@/components/ui/sonner';
import { createTeamSchema, type CreateTeamFormValues } from '@/schemas/team';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({ open, onOpenChange }) => {
  const { createTeam } = useTeam();

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      department: '',
    },
  });

  const onSubmit = async (values: CreateTeamFormValues) => {
    const res = await createTeam(values.name, values.department || undefined);
    if (res.success && res.team) {
      toast.success(`Ward "${res.team.name}" created! Join code: ${res.team.code}`);
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(res.message || 'Failed to create ward');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Ward or Shift Team</DialogTitle>
              <DialogDescription>
                Set up a new clinical ward, nursing unit, or department with its own shift schedule.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward / Unit Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Ward 4B – Acute Medicine"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Internal Medicine / ICU"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={!form.formState.isValid}
              >
                Create Ward
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
