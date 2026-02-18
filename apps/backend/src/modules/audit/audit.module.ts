import { Module } from '@nestjs/common';
import { AuditResolver } from './audit.resolver';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditResolver, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
