import { NotFoundException } from '@nestjs/common';
import type { ListQuery } from '@pms/shared';
import type { Patient as PatientEntity } from '@prisma/client';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

function makeEntity(overrides: Partial<PatientEntity> = {}): PatientEntity {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phoneNumber: '+1 (555) 123-4567',
    dob: new Date('1990-12-10T00:00:00.000Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

const baseQuery: ListQuery = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

describe('PatientsService', () => {
  let service: PatientsService;
  let repo: jest.Mocked<Pick<PatientsRepository, 'findMany' | 'findById' | 'create' | 'update' | 'delete'>>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new PatientsService(repo as unknown as PatientsRepository);
  });

  it('maps entities to DTOs and returns pagination metadata', async () => {
    repo.findMany.mockResolvedValue({ data: [makeEntity()], total: 1 });
    const result = await service.findAll(baseQuery);
    expect(result).toEqual({
      data: [
        expect.objectContaining({ dob: '1990-12-10', createdAt: '2024-01-01T00:00:00.000Z' }),
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('throws NotFound when fetching a missing patient', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when updating a missing patient', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      service.update('missing', {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        phoneNumber: '+1 555 111 2222',
        dob: '1990-01-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns { ok: true } after deleting an existing patient', async () => {
    repo.findById.mockResolvedValue(makeEntity());
    repo.delete.mockResolvedValue(makeEntity());
    await expect(service.remove('22222222-2222-2222-2222-222222222222')).resolves.toEqual({
      ok: true,
    });
  });
});
