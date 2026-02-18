import { Module } from '@nestjs/common';
import { ResultService } from './result.service';
import { ResultResolver } from './result.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SessionModule, NotificationsModule],
  providers: [ResultService, ResultResolver],
  exports: [ResultService],
})
export class ResultModule {}
