import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser, Role } from '@pms/shared';
import { RolesGuard } from './roles.guard';

function makeContext(user?: AuthUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function guardWithRoles(roles: Role[] | undefined): RolesGuard {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  const admin: AuthUser = { id: '1', email: 'a@a.com', role: 'admin' };
  const user: AuthUser = { id: '2', email: 'u@u.com', role: 'user' };

  it('allows any user when no roles are required', () => {
    expect(guardWithRoles(undefined).canActivate(makeContext(user))).toBe(true);
  });

  it('allows a user whose role matches', () => {
    expect(guardWithRoles(['admin']).canActivate(makeContext(admin))).toBe(true);
  });

  it('forbids a user whose role does not match', () => {
    expect(() => guardWithRoles(['admin']).canActivate(makeContext(user))).toThrow(
      ForbiddenException,
    );
  });

  it('forbids when there is no authenticated user', () => {
    expect(() => guardWithRoles(['admin']).canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
