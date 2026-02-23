import {
  Controller,
  Post,
  Headers,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/paystack')
export class PaymentWebhookController {
  private paystackSecretKey: string;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {
    this.paystackSecretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  @Post()
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    // 1. Verify that the request is actually from Paystack using the raw unparsed body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
    }

    // 2. Acknowledge receipt of the webhook immediately
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.status(HttpStatus.OK).send();

    // 3. Process the event
    const event = req.body;

    try {
      if (event.event === 'charge.success') {
        const reference = event.data.reference;

        // Finalize the payment automatically using the existing verify block
        // (the verifyPayment service already checks if it is verified, preventing duplicates)
        await this.paymentService.verifyPayment(reference);
      }
    } catch (error) {
      console.error(
        'Webhook processing error for reference:',
        event?.data?.reference,
        error,
      );
    }
  }
}
