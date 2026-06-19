import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  loginSchema,
  type AuthUser,
  type LoginInput,
  type LoginResponse,
} from '@pms/shared';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { AuthUserDto, LoginDto, LoginResponseDto } from './dto/auth.dto';
import { ACCESS_TOKEN_COOKIE } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in', description: 'Sets an httpOnly cookie and returns the token.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.login(dto.email, dto.password);
    res.cookie(ACCESS_TOKEN_COOKIE, result.token, this.cookieOptions());
    // Token is also returned in the body to satisfy the API contract.
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out', description: 'Clears the auth cookie.' })
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions(true));
    return { ok: true };
  }

  /** Returns the current session's user — used by the web app to bootstrap auth. */
  @Get('me')
  @ApiCookieAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user', description: 'Returns the authenticated session user.' })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private cookieOptions(clearing = false): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.auth.isProduction,
      path: '/',
      ...(clearing ? {} : { maxAge: this.auth.cookieMaxAgeMs }),
    };
  }
}
