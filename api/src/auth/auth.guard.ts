import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ROLES_KEY, Role } from './roles.decorator';
import { extractAccessToken } from './token.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = extractAccessToken(request, request.headers.authorization);
    if (!accessToken) throw new UnauthorizedException('Authentication is required.');

    const { profile } = await this.auth.authenticate(accessToken);

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.includes(profile.role)) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    request['profile'] = profile;
    request['accessToken'] = accessToken;
    return true;
  }
}
