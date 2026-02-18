import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { EmailWorker } from './workers/email.worker';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    EmailModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'notifications',
      },
      {
        name: 'email',
      },
    ),
  ],
  providers: [EmailWorker],
  exports: [BullModule],
})
export class QueueModule {}
