import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DashboardResolver, DashboardService],
})
export class DashboardModule {}
