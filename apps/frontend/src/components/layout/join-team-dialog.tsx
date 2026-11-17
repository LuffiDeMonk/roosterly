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

interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinTeamDialog: React.FC<JoinTeamDialogProps> = ({ open, onOpenChange }) => {
  const { joinTeamByCode } = useTeam();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a team code');
      return;
    }

    setSubmitting(true);
    const res = await joinTeamByCode(code);
    setSubmitting(false);

    if (res.success) {
      toast.success(res.message || 'Ward team joined!');
      setCode('');
      onOpenChange(false);
    } else {
      toast.error(res.message || 'Failed to join ward team');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join a Ward or Department</DialogTitle>
            <DialogDescription>
              Enter the 6-character code provided by your ward supervisor or facility administrator.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Input
              label="6-Character Ward Code"
              placeholder="e.g. ED4B92"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center font-mono tracking-widest uppercase text-lg"
              autoFocus
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
            <Button type="submit" loading={submitting} disabled={code.trim().length !== 6}>
              Join Ward
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
