import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '@pms/shared';

/**
 * OpenAPI/Swagger DTOs. These mirror the shared Zod contract (`@pms/shared`)
 * for documentation only — runtime validation is still performed by the Zod
 * schemas via ZodValidationPipe, which remain the source of truth.
 */
export class LoginDto {
  @ApiProperty({ format: 'email', example: 'admin@demo.com' })
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 1 })
  password!: string;
}

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email', example: 'admin@demo.com' })
  email!: string;

  @ApiProperty({ enum: ['admin', 'user'], example: 'admin' })
  role!: Role;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Signed JWT (also set as an httpOnly cookie)' })
  token!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
