import { Injectable } from '@nestjs/common';
import type { ListQuery, PatientInput } from '@pms/shared';
import { Prisma, type Patient as PatientEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { parseDob } from './patients.mapper';

export interface PaginatedPatients {
  data: PatientEntity[];
  total: number;
}

/**
 * Data-access layer for patients. Keeps all Prisma query construction in one
 * place so the service stays focused on business logic and stays testable.
 */
@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: ListQuery): Promise<PaginatedPatients> {
    const where = this.buildWhere(query.search);
    const skip = (query.page - 1) * query.limit;

    // Run the page query and the count in parallel.
    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string): Promise<PatientEntity | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  create(input: PatientInput): Promise<PatientEntity> {
    return this.prisma.patient.create({
      data: { ...input, dob: parseDob(input.dob) },
    });
  }

  update(id: string, input: PatientInput): Promise<PatientEntity> {
    return this.prisma.patient.update({
      where: { id },
      data: { ...input, dob: parseDob(input.dob) },
    });
  }

  delete(id: string): Promise<PatientEntity> {
    return this.prisma.patient.delete({ where: { id } });
  }

  private buildWhere(search?: string): Prisma.PatientWhereInput {
    if (!search) {
      return {};
    }
    const contains = { contains: search, mode: Prisma.QueryMode.insensitive } as const;
    return {
      OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
    };
  }
}
