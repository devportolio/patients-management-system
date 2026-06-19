'use client';

import type { Patient } from '@pms/shared';
import { CalendarDays, Hash, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { calculateAge, formatDate, initials } from '@/lib/utils';

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function PatientDetailsDialog({ open, onOpenChange, patient }: PatientDetailsDialogProps) {
  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
              {initials(patient.firstName, patient.lastName)}
            </span>
            <div>
              <DialogTitle>
                {patient.firstName} {patient.lastName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="secondary">{calculateAge(patient.dob)} years old</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="divide-y divide-border rounded-lg border border-border px-4">
          <DetailRow icon={Mail} label="Email" value={patient.email} />
          <DetailRow icon={Phone} label="Phone" value={patient.phoneNumber} />
          <DetailRow icon={CalendarDays} label="Date of birth" value={formatDate(patient.dob)} />
          <DetailRow icon={Hash} label="Patient ID" value={patient.id} />
        </div>

        <p className="text-xs text-muted-foreground">
          Added {formatDate(patient.createdAt)} · last updated {formatDate(patient.updatedAt)}
        </p>
      </DialogContent>
    </Dialog>
  );
}
