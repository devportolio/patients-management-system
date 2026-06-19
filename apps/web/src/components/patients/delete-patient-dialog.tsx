'use client';

import type { Patient } from '@pms/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeletePatient } from '@/features/patients/use-patients';

interface DeletePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function DeletePatientDialog({ open, onOpenChange, patient }: DeletePatientDialogProps) {
  const deletePatient = useDeletePatient();

  const onConfirm = () => {
    if (!patient) return;
    // Optimistic removal happens in the hook; close immediately for a snappy feel.
    deletePatient.mutate(patient.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete patient?</DialogTitle>
          <DialogDescription>
            {patient ? (
              <>
                This will permanently remove{' '}
                <span className="font-medium text-foreground">
                  {patient.firstName} {patient.lastName}
                </span>{' '}
                from the directory. This action can’t be undone.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
