import { z } from 'zod';

// Accepts +, digits, spaces, dashes, parentheses; 7–20 characters of meaningful input.
const phoneRegex = /^[+]?[0-9\s().-]{7,20}$/;

const MAX_AGE_YEARS = 150;

/**
 * Date of birth as an ISO calendar date (YYYY-MM-DD).
 * Must be a real date, not in the future, and within a plausible human lifespan.
 */
const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime());
  }, 'Date of birth is not a valid date')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return date.getTime() <= Date.now();
  }, 'Date of birth cannot be in the future')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    const earliest = new Date();
    earliest.setUTCFullYear(earliest.getUTCFullYear() - MAX_AGE_YEARS);
    return date.getTime() >= earliest.getTime();
  }, `Date of birth cannot be more than ${MAX_AGE_YEARS} years ago`);

/** The editable fields of a patient (used for both create and update). */
export const patientInputSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255),
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid phone number'),
  dob: dobSchema,
});
export type PatientInput = z.infer<typeof patientInputSchema>;

export const createPatientSchema = patientInputSchema;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// PUT semantics: full replacement of the editable fields.
export const updatePatientSchema = patientInputSchema;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

/** A full patient record as returned by the API. */
export const patientSchema = patientInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Patient = z.infer<typeof patientSchema>;
