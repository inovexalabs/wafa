import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

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
      sameSite: 'lax' as const,
      path: '/',
      ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    };
    response.cookie(accessCookie, session.accessToken, cookieOptions);
    response.cookie(refreshCookie, session.refreshToken, cookieOptions);
    response.cookie(rememberCookie, rememberMe ? '1' : '0', cookieOptions);
  }

  private clearSessionCookies(response: Response) {
    response.clearCookie(accessCookie, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
    response.clearCookie(refreshCookie, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
    response.clearCookie(rememberCookie, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
  }

  private getCookie(request: Request, name: string) {
    const cookies = request.headers.cookie?.split(';') ?? [];
    const match = cookies.find((cookie) => cookie.trim().startsWith(name + '='));
    return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
  }

  private getAccessToken(request: Request, authorization?: string) {
    return authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : this.getCookie(request, accessCookie);
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
  createUserAsSuperadmin(
    @Req() request: Request,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateUserBody,
  ) {
    const accessToken = this.getAccessToken(request, authorization);
    if (!accessToken) throw new UnauthorizedException('Authentication is required.');
    return this.authService.createUser(accessToken, body, 'superadmin');
  }

  @Post('admin/users')
  createUserAsAdmin(
    @Req() request: Request,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Omit<CreateUserBody, 'role'> & { role: 'member' | 'accountant' },
  ) {
    const accessToken = this.getAccessToken(request, authorization);
    if (!accessToken) throw new UnauthorizedException('Authentication is required.');
    return this.authService.createUser(accessToken, body, 'admin');
  }
}

