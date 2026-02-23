import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentResolver, ResultAccessResolver } from './payment.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PaymentWebhookController } from './payment.webhook.controller';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  controllers: [PaymentWebhookController],
  providers: [PaymentService, PaymentResolver, ResultAccessResolver],
  exports: [PaymentService],
})
export class PaymentModule {}
