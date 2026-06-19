import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  createPatientSchema,
  listQuerySchema,
  patientSortableFields,
  updatePatientSchema,
  type ListQuery,
  type PaginatedResponse,
  type Patient,
  type PatientInput,
} from '@pms/shared';
import { OkResponseDto } from '../../common/dto/ok-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreatePatientDto,
  PaginatedPatientsDto,
  PatientDto,
  UpdatePatientDto,
} from './dto/patient.dto';
import { PatientsService } from './patients.service';

/**
 * REST endpoints for patients.
 * Reads are open to any authenticated user; writes are admin-only — enforced by
 * the globally-registered RolesGuard reading the @Roles() metadata below.
 */
@ApiTags('Patients')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List patients', description: 'Paginated, searchable, sortable list.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Matches first name, last name, or email' })
  @ApiQuery({ name: 'sortBy', required: false, enum: patientSortableFields })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ type: PaginatedPatientsDto })
  findAll(
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<PaginatedResponse<Patient>> {
    return this.patients.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PatientDto })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
    return this.patients.findOne(id);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a patient', description: 'Admin only.' })
  @ApiCreatedResponse({ type: PatientDto })
  @ApiForbiddenResponse({ description: 'Requires the admin role' })
  create(
    @Body(new ZodValidationPipe(createPatientSchema)) dto: CreatePatientDto,
  ): Promise<Patient> {
    return this.patients.create(dto as PatientInput);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a patient', description: 'Admin only.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PatientDto })
  @ApiForbiddenResponse({ description: 'Requires the admin role' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePatientSchema)) dto: UpdatePatientDto,
  ): Promise<Patient> {
    return this.patients.update(id, dto as PatientInput);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a patient', description: 'Admin only.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiForbiddenResponse({ description: 'Requires the admin role' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ ok: true }> {
    return this.patients.remove(id);
  }
}
