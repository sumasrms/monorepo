import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SessionService } from '../../modules/session/session.service';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SessionInterceptor implements NestInterceptor {
  constructor(private readonly sessionService: SessionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    if (request) {
      const settings = (await this.sessionService.getAcademicSettings()) as any;
      if (settings) {
        request.academicContext = {
          sessionId: settings.currentSessionId,
          session: settings.currentSession?.session,
          semester: settings.currentSemester,
        };
      }
    }

    return next.handle();
  }
}
