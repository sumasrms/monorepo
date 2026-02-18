import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentResolver, ResultAccessResolver } from './payment.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  providers: [PaymentService, PaymentResolver, ResultAccessResolver],
  exports: [PaymentService],
})
export class PaymentModule {}
