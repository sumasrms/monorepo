import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { auth } from 'lib/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext();
    const req = gqlCtx.req || gqlCtx.request;

    // Better Auth integration
    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }

    req.session = session;
    req.user = session.user;

    return true;
  }
}
