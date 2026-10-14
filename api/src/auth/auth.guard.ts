import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY, Role } from './roles.decorator';
import { extractAccessToken } from './token.util';

// Registered globally (APP_GUARD) and also via @UseGuards on most controllers,
// so it runs twice per request; the session is only verified the first time.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest<Request>();
    let profile = request['profile'] as { role: Role } | undefined;
    if (!profile) {
      const accessToken = extractAccessToken(request, request.headers.authorization);
      if (!accessToken) throw new UnauthorizedException('Authentication is required.');
      ({ profile } = await this.auth.authenticate(accessToken));
      request['profile'] = profile;
      request['accessToken'] = accessToken;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (requiredRoles?.length && !requiredRoles.includes(profile.role)) {
      throw new ForbiddenException('You do not have access to this resource.');
    }
    return true;
  }
}
