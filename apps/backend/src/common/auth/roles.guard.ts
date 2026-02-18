import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context).getContext<{
      req: { user?: { role?: string } };
      request: { user?: { role?: string } };
    }>();
    const req = gqlCtx.req || gqlCtx.request;
    const user = req.user;

    console.log('[RolesGuard] Checking permissions:', {
      requiredRoles,
      userId: user || 'NO_USER',
      userRole: user?.role || 'NO_ROLE',
      hasUser: !!user,
      hasRole: user?.role ? true : false,
    });

    if (!user || !user.role) {
      console.log('[RolesGuard] DENIED - User or role missing');
      throw new ForbiddenException('User has no role assigned');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      console.log('[RolesGuard] DENIED - Role not in required list');
      throw new ForbiddenException('Insufficient permissions');
    }

    console.log('[RolesGuard] ALLOWED - Role check passed');
    return true;
  }
}
