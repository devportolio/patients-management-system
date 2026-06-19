import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Validates and transforms incoming payloads against a Zod schema — the same
 * schemas the frontend uses (from @pms/shared), guaranteeing a single contract.
 *
 * Usage: `@Body(new ZodValidationPipe(createPatientSchema)) dto: CreatePatientInput`
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.issues.map((issue) => {
            const path = issue.path.join('.');
            return path ? `${path}: ${issue.message}` : issue.message;
          }),
          error: 'Bad Request',
        });
      }
      throw error;
    }
  }
}
