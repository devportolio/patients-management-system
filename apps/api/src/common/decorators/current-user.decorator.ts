import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@pms/shared';

/**
 * Extracts the authenticated user (attached by JwtStrategy) from the request.
 * Optionally pass a property name to pluck a single field, e.g. `@CurrentUser('id')`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
