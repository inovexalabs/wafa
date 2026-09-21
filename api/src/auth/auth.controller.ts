import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentAccessToken } from './current-access-token.decorator';
import { Roles } from './roles.decorator';

const accessCookie = 'wafa_access_token';
const refreshCookie = 'wafa_refresh_token';
const rememberCookie = 'wafa_remember';
const isProduction = process.env.NODE_ENV === 'production';

type CreateUserBody = {
  userId: string;
  email: string;
  password: string;
  role: 'admin' | 'member' | 'accountant';
  fullName?: string;
  memberNumber?: string;
  phone?: string;
};


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookies(
    response: Response,
    session: { accessToken: string; refreshToken: string },
    rememberMe: boolean,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    };
    response.cookie(accessCookie, session.accessToken, cookieOptions);
    response.cookie(refreshCookie, session.refreshToken, cookieOptions);
    response.cookie(rememberCookie, rememberMe ? '1' : '0', cookieOptions);
  }

  private clearSessionCookies(response: Response) {
    const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax', path: '/' };
    response.clearCookie(accessCookie, cookieOptions);
    response.clearCookie(refreshCookie, cookieOptions);
    response.clearCookie(rememberCookie, cookieOptions);
  }

  private getCookie(request: Request, name: string) {
    const cookies = request.headers.cookie?.split(';') ?? [];
    const match = cookies.find((cookie) => cookie.trim().startsWith(name + '='));
    return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { userId: string; password: string; rememberMe?: boolean },
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(body?.userId, body?.password);
    this.setSessionCookies(response, session, body?.rememberMe === true);
    return { user: session.user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.refresh(this.getCookie(request, refreshCookie) ?? '');
    this.setSessionCookies(response, session, this.getCookie(request, rememberCookie) === '1');
    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(this.getCookie(request, accessCookie));
    this.clearSessionCookies(response);
  }

  @Post('superadmin/users')
  @UseGuards(AuthGuard)
  @Roles('superadmin')
  createUserAsSuperadmin(
    @CurrentAccessToken() accessToken: string,
    @Body() body: CreateUserBody,
  ) {
    return this.authService.createUser(accessToken, body, 'superadmin');
  }

  @Post('admin/users')
  @UseGuards(AuthGuard)
  @Roles('admin')
  createUserAsAdmin(
    @CurrentAccessToken() accessToken: string,
    @Body() body: Omit<CreateUserBody, 'role'> & { role: 'member' | 'accountant' },
  ) {
    return this.authService.createUser(accessToken, body, 'admin');
  }
}

