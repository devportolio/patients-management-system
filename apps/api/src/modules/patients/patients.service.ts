import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListQuery, PaginatedResponse, Patient, PatientInput } from '@pms/shared';
import { PatientsRepository } from './patients.repository';
import { toPatientDto } from './patients.mapper';

@Injectable()
export class PatientsService {
  constructor(private readonly repository: PatientsRepository) {}

  async findAll(query: ListQuery): Promise<PaginatedResponse<Patient>> {
    const { data, total } = await this.repository.findMany(query);
    return {
      data: data.map(toPatientDto),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return toPatientDto(patient);
  }

  async create(input: PatientInput): Promise<Patient> {
    const created = await this.repository.create(input);
    return toPatientDto(created);
  }

  async update(id: string, input: PatientInput): Promise<Patient> {
    await this.ensureExists(id);
    const updated = await this.repository.update(id, input);
    return toPatientDto(updated);
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.ensureExists(id);
    await this.repository.delete(id);
    return { ok: true };
  }

  private async ensureExists(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
  }
}
