import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { FcmService } from './fcm.service';
import { NotificationWorker } from './workers/notification.worker';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    EmailModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsResolver,
    FcmService,
    NotificationWorker,
  ],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
