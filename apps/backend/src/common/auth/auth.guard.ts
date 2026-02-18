import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { auth } from 'lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role?: string | null;
}

export interface SessionData {
  id: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
}

export interface Session {
  user: SessionUser;
  session: SessionData;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  session?: Session;
  user?: SessionUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
      request: AuthenticatedRequest;
    }>();
    const req = gqlCtx.req || gqlCtx.request;

    // Better Auth integration
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });

    console.log('[AuthGuard] Session received:', {
      userId: session?.user?.id,
      userRole: (session?.user as any)?.role,
      sessionId: session?.session?.id,
    });

    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }

    req.session = session;
    req.user = session.user;

    console.log('[AuthGuard] Setting req.user:', {
      userId: req.user?.id,
      userRole: req.user?.role,
    });

    return true;
  }
}
