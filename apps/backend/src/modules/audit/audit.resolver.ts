import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog, AuditLogFilterInput } from './entities/audit.entity';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => AuditLog)
@UseGuards(AuthGuard, RolesGuard)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @Query(() => [AuditLog])
  @Roles(roles.ADMIN)
  async auditLogs(
    @Args('filter', { nullable: true }) filter?: AuditLogFilterInput,
  ) {
    return this.auditService.getAuditLogs(filter);
  }
}
