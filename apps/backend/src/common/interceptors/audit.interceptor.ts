import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory } from '@prisma/client';

function sanitizeArgs(args: Record<string, any>) {
  if (!args) return args;

  const clone = JSON.parse(JSON.stringify(args));
  const input = clone.input;

  if (input?.results && Array.isArray(input.results)) {
    input.results = { count: input.results.length };
  }

  return clone;
}

function inferEntity(args: Record<string, any>) {
  if (!args) return { entityType: null, entityId: null };

  const input = args.input || {};
  const entityId =
    args.id ||
    input.id ||
    input.courseId ||
    input.departmentId ||
    input.facultyId ||
    input.studentId ||
    input.staffId ||
    input.userId ||
    input.resultId ||
    null;

  const entityType = input.courseId
    ? 'Course'
    : input.departmentId
      ? 'Department'
      : input.facultyId
        ? 'Faculty'
        : input.studentId
          ? 'Student'
          : input.staffId
            ? 'Staff'
            : input.userId
              ? 'User'
              : input.resultId
                ? 'Result'
                : null;

  return { entityType, entityId };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo();
    const ctx = gqlCtx.getContext();
    const req = ctx?.req;

    const isMutation = info?.parentType?.name === 'Mutation';
    if (!isMutation) {
      return next.handle();
    }

    const action = info.fieldName;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const user = req?.user;
          if (!user?.id || !user?.role) {
            return;
          }

          const role = String(user.role).toLowerCase();
          const category = action.toLowerCase().includes('result')
            ? AuditCategory.RESULT
            : role === 'admin'
              ? AuditCategory.ADMIN
              : AuditCategory.ADMIN;

          const { entityType, entityId } = inferEntity(gqlCtx.getArgs());
          const metadata = {
            args: sanitizeArgs(gqlCtx.getArgs()),
            resultCount: Array.isArray(result) ? result.length : undefined,
          };

          const ipAddress =
            req?.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() ||
            req?.ip ||
            null;
          const userAgent = req?.headers?.['user-agent'] || null;
          const departmentId =
            user?.staffProfile?.departmentId ||
            user?.studentProfile?.departmentId ||
            null;

          await this.prisma.auditLog.create({
            data: {
              category,
              action,
              entityType,
              entityId,
              actorId: user.id,
              actorRole: user.role,
              metadata,
              ipAddress,
              userAgent,
              departmentId,
            },
          });
        } catch (error) {
          return;
        }
      }),
    );
  }
}
