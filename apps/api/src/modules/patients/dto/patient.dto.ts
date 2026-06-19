import { ApiProperty } from '@nestjs/swagger';

/**
 * OpenAPI/Swagger DTOs mirroring the shared Zod contract (`@pms/shared`) for
 * documentation only — validation is performed by the Zod schemas.
 */
export class CreatePatientDto {
  @ApiProperty({ example: 'Ada', maxLength: 100 })
  firstName!: string;

  @ApiProperty({ example: 'Lovelace', maxLength: 100 })
  lastName!: string;

  @ApiProperty({ format: 'email', example: 'ada@example.com' })
  email!: string;

  @ApiProperty({ example: '+1 (555) 123-4567' })
  phoneNumber!: string;

  @ApiProperty({ format: 'date', example: '1990-12-10', description: 'Date of birth (YYYY-MM-DD)' })
  dob!: string;
}

// PUT replaces the full record, so the update payload matches create.
export class UpdatePatientDto extends CreatePatientDto {}

export class PatientDto extends CreatePatientDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class PaginatedPatientsDto {
  @ApiProperty({ type: [PatientDto] })
  data!: PatientDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 50 })
  total!: number;
}
