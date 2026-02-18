import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  InitiatePaymentInput,
  PaystackInitResponse,
  PaymentVerificationResponse,
} from './entities/payment.entity';
import { PaymentStatus, Semester } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  private paystackSecretKey: string;
  private paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.paystackSecretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    if (!this.paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
  }

  async initiatePayment(input: InitiatePaymentInput) {
    const { studentId, amount, semester, session, description } = input;

    // Validate student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    try {
      // Generate unique reference for this payment
      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare Paystack initialization payload
      const paystackPayload = {
        amount: Math.round(amount * 100), // Paystack uses kobo (smallest unit)
        email: student.user.email,
        reference,
        metadata: {
          studentId,
          semester,
          session,
          matricNumber: student.matricNumber,
          studentName: student.user.name,
          paymentType: 'RESULT_ACCESS',
          description: description || 'Result checking fee',
        },
      };

      // Call Paystack API to initialize transaction
      const response = await firstValueFrom(
        this.httpService.post<PaystackInitResponse>(
          `${this.paystackBaseUrl}/transaction/initialize`,
          paystackPayload,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          },
        ),
      );

      const paystackData = response.data;

      if (!paystackData.status) {
        throw new InternalServerErrorException('Failed to initialize payment');
      }

      // Save payment record to database
      const payment = await this.prisma.payment.create({
        data: {
          studentId,
          amount,
          currency: 'NGN',
          paymentType: 'RESULT_ACCESS',
          status: PaymentStatus.PENDING,
          paystackReference: reference,
          paystackAccessCode: paystackData.data?.accessCode,
          semester,
          session,
          metadata: {
            displayName: student.user.name,
            email: student.user.email,
            description: description || 'Result checking fee',
          },
        },
      });

      return {
        success: true,
        message: 'Payment initialized successfully',
        payment,
        authorizationUrl: paystackData.data?.authorization_url,
        accessCode: paystackData.data?.access_code,
        reference,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      console.error('Payment initialization error:', error);
      throw new InternalServerErrorException('Failed to initiate payment');
    }
  }

  async verifyPayment(reference: string) {
    try {
      // Find payment record
      const payment = await this.prisma.payment.findUnique({
        where: { paystackReference: reference },
        include: { resultAccess: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Verify with Paystack API
      const response = await firstValueFrom(
        this.httpService.get<PaymentVerificationResponse>(
          `${this.paystackBaseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          },
        ),
      );

      const verificationData = response.data;

      if (!verificationData.status) {
        throw new InternalServerErrorException('Payment verification failed');
      }

      const data = verificationData.data;
      const isSuccess = data?.status === 'success';

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          paystackTransactionId: data?.reference,
          paystackChannel: data?.channel,
          paystackPaidAt: isSuccess ? new Date(data?.paid_at) : null,
        },
      });

      // If payment successful, create result access
      let resultAccess: any = null;
      if (isSuccess && !payment.resultAccess) {
        resultAccess = await this.prisma.resultAccess.create({
          data: {
            studentId: payment.studentId,
            paymentId: payment.id,
            semester: payment.semester,
            session: payment.session,
            accessCount: 0,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
        });
      }

      return {
        success: isSuccess,
        message: isSuccess ? 'Payment verified successfully' : 'Payment failed',
        payment: updatedPayment,
        resultAccess,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Payment verification error:', error);
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  async getPaymentHistory(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.payment.findMany({
      where: { studentId },
      include: { resultAccess: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResultAccessByStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.resultAccess.findMany({
      where: { studentId },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async canAccessResults(
    studentId: string,
    semester: Semester,
    session: string,
  ): Promise<boolean> {
    const resultAccess = await this.prisma.resultAccess.findUnique({
      where: {
        studentId_semester_session: {
          studentId,
          semester,
          session,
        },
      },
    });

    if (!resultAccess) {
      return false;
    }

    // Check if access is still valid (not expired)
    if (resultAccess.expiresAt && resultAccess.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  async incrementAccessCount(
    studentId: string,
    semester: Semester,
    session: string,
  ) {
    return this.prisma.resultAccess.update({
      where: {
        studentId_semester_session: {
          studentId,
          semester,
          session,
        },
      },
      data: {
        accessCount: {
          increment: 1,
        },
      },
    });
  }

  async getPaymentSummary(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [payments, resultAccess] = await Promise.all([
      this.prisma.payment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5, // Get 5 most recent
      }),
      this.prisma.resultAccess.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSpent = payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalSpent,
      totalTransactions: payments.length,
      recentPayments: payments,
      accessedResults: resultAccess,
    };
  }
}
