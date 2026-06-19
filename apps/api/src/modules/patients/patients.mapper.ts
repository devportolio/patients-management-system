import type { Patient } from '@pms/shared';
import type { Patient as PatientEntity } from '@prisma/client';

/** Serializes a Prisma Patient entity into the public API shape (@pms/shared Patient). */
export function toPatientDto(entity: PatientEntity): Patient {
  return {
    id: entity.id,
    firstName: entity.firstName,
    lastName: entity.lastName,
    email: entity.email,
    phoneNumber: entity.phoneNumber,
    dob: entity.dob.toISOString().slice(0, 10), // YYYY-MM-DD
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/** Parses a YYYY-MM-DD calendar date into a UTC Date for storage. */
export function parseDob(dob: string): Date {
  return new Date(`${dob}T00:00:00.000Z`);
}
