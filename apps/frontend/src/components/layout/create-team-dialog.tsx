import React, { useState } from 'react';
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
import { useTeam } from '@/context/team-context';
import { toast } from '@/components/ui/sonner';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({ open, onOpenChange }) => {
  const { createTeam } = useTeam();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ward/Unit name is required');
      return;
    }

    setSubmitting(true);
    const res = await createTeam(name.trim(), department.trim() || undefined);
    setSubmitting(false);

    if (res.success && res.team) {
      toast.success(`Ward "${res.team.name}" created! Join code: ${res.team.code}`);
      setName('');
      setDepartment('');
      onOpenChange(false);
    } else {
      toast.error(res.message || 'Failed to create ward');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Ward or Shift Team</DialogTitle>
            <DialogDescription>
              Set up a new clinical ward, nursing unit, or department with its own shift schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Input
              label="Ward / Unit Name"
              placeholder="e.g. Ward 4B – Acute Medicine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Department (Optional)"
              placeholder="e.g. Internal Medicine / ICU"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={!name.trim()}>
              Create Ward
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
