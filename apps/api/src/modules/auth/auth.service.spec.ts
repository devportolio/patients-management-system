import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { TypedConfigService } from '../../config/typed-config.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: { findByEmail: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let adminUser: User;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    adminUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@demo.com',
      passwordHash,
      role: Role.admin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  beforeEach(() => {
    users = { findByEmail: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    const config = {
      get: jest.fn((key: string) => (key === 'JWT_EXPIRES_IN' ? '15m' : 'development')),
    };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      config as unknown as TypedConfigService,
    );
  });

  it('returns a token and user on valid credentials', async () => {
    users.findByEmail.mockResolvedValue(adminUser);
    const result = await service.login('admin@demo.com', 'Password123!');
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user).toEqual({ id: adminUser.id, email: adminUser.email, role: 'admin' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: adminUser.id,
      email: adminUser.email,
      role: 'admin',
    });
  });

  it('throws Unauthorized when the user does not exist', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login('nope@demo.com', 'whatever')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized when the password is wrong', async () => {
    users.findByEmail.mockResolvedValue(adminUser);
    await expect(service.login('admin@demo.com', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('derives cookie max-age from the configured expiry', () => {
    expect(service.cookieMaxAgeMs).toBe(15 * 60 * 1000);
  });
});
