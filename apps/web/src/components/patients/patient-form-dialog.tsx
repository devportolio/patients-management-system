'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { patientInputSchema, type Patient, type PatientInput } from '@pms/shared';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreatePatient, useUpdatePatient } from '@/features/patients/use-patients';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
}

const EMPTY: PatientInput = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dob: '',
};

type TextField = {
  name: 'firstName' | 'lastName' | 'email' | 'phoneNumber';
  label: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  half?: boolean;
};

const TEXT_FIELDS: TextField[] = [
  { name: 'firstName', label: 'First name', type: 'text', placeholder: 'Ada', half: true },
  { name: 'lastName', label: 'Last name', type: 'text', placeholder: 'Lovelace', half: true },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'ada@example.com' },
  { name: 'phoneNumber', label: 'Phone number', type: 'tel', placeholder: '+1 (555) 123-4567' },
];

export function PatientFormDialog({ open, onOpenChange, patient }: PatientFormDialogProps) {
  const isEdit = Boolean(patient);
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const form = useForm<PatientInput>({
    resolver: zodResolver(patientInputSchema),
    defaultValues: EMPTY,
  });

  // Reset the form whenever the dialog opens for a different record.
  React.useEffect(() => {
    if (open) {
      form.reset(
        patient
          ? {
              firstName: patient.firstName,
              lastName: patient.lastName,
              email: patient.email,
              phoneNumber: patient.phoneNumber,
              dob: patient.dob,
            }
          : EMPTY,
      );
    }
  }, [open, patient, form]);

  const isPending = createPatient.isPending || updatePatient.isPending;

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit && patient) {
      updatePatient.mutate(
        { id: patient.id, input: values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createPatient.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit patient' : 'Add patient'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the patient’s details. Changes apply immediately.'
              : 'Enter the patient’s details to add them to the directory.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem className={f.half ? '' : 'sm:col-span-2'}>
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        <Input
                          type={f.type}
                          placeholder={f.placeholder}
                          autoComplete={f.autoComplete}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select date of birth"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending} disabled={isEdit && !form.formState.isDirty}>
                {isEdit ? 'Save changes' : 'Add patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
