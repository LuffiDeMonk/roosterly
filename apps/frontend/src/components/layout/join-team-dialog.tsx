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
import { joinTeamSchema, type JoinTeamFormValues } from '@/schemas/team';

interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinTeamDialog: React.FC<JoinTeamDialogProps> = ({ open, onOpenChange }) => {
  const { joinTeamByCode } = useTeam();

  const form = useForm<JoinTeamFormValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (values: JoinTeamFormValues) => {
    const res = await joinTeamByCode(values.code);
    if (res.success) {
      toast.success(res.message || 'Ward team joined!');
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(res.message || 'Failed to join ward team');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Join a Ward or Department</DialogTitle>
              <DialogDescription>
                Enter the 6-character code provided by your ward supervisor or facility administrator.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Character Ward Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. ED4B92"
                        maxLength={6}
                        className="text-center font-mono tracking-widest uppercase text-lg"
                        autoFocus
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                Join Ward
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
