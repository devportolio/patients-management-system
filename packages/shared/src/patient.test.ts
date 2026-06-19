import { describe, expect, it } from 'vitest';
import { createPatientSchema } from './patient';
import { listQuerySchema } from './common';

const validInput = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'Ada@Example.com',
  phoneNumber: '+1 (555) 123-4567',
  dob: '1990-12-10',
};

describe('createPatientSchema', () => {
  it('accepts a valid patient and lowercases the email', () => {
    const result = createPatientSchema.parse(validInput);
    expect(result.email).toBe('ada@example.com');
  });

  it('rejects a future date of birth', () => {
    const result = createPatientSchema.safeParse({ ...validInput, dob: '3000-01-01' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    const result = createPatientSchema.safeParse({ ...validInput, phoneNumber: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty last name', () => {
    const result = createPatientSchema.safeParse({ ...validInput, lastName: '   ' });
    expect(result.success).toBe(false);
  });
});

describe('listQuerySchema', () => {
  it('applies defaults and coerces string query params', () => {
    const result = listQuerySchema.parse({ page: '2', limit: '25' });
    expect(result).toMatchObject({ page: 2, limit: 25, sortBy: 'createdAt', sortOrder: 'desc' });
  });

  it('rejects an out-of-range limit', () => {
    expect(listQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
