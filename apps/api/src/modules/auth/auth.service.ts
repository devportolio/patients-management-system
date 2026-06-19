import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser, JwtPayload, LoginResponse } from '@pms/shared';
import * as bcrypt from 'bcryptjs';
import { TypedConfigService } from '../../config/typed-config.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: TypedConfigService,
  ) {}

  /** Verifies credentials with a constant-time bcrypt compare. */
  async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Run a dummy compare to reduce timing-based user enumeration.
      await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv');
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateCredentials(email, password);
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(payload);
    return { token, user };
  }

  /** Cookie max-age in ms, derived from the configured JWT lifetime. */
  get cookieMaxAgeMs(): number {
    return parseExpiry(this.config.get('JWT_EXPIRES_IN'));
  }

  get isProduction(): boolean {
    return this.config.get('NODE_ENV') === 'production';
  }
}

/** Converts strings like "15m", "1h", "7d", or "900" (seconds) into milliseconds. */
function parseExpiry(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    return 15 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (unitMs[unit] ?? 1000);
}
