import { ObjectType, Field, ID, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PaymentStatus, PaymentType, Semester } from '@prisma/client';
import { Type } from 'class-transformer';

@ObjectType()
export class PaymentMetadata {
  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true, description: 'Additional metadata' })
  extra?: string;
}

@ObjectType()
export class ResultAccess {
  @Field(() => ID)
  id: string;

  @Field()
  studentId: string;

  @Field()
  paymentId: string;

  @Field()
  semester: Semester;

  @Field()
  session: string;

  @Field(() => Int)
  accessCount: number;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Payment, { nullable: true })
  payment?: any;
}

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field()
  studentId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field()
  paymentType: PaymentType;

  @Field()
  status: PaymentStatus;

  @Field()
  paystackReference: string;

  @Field({ nullable: true })
  paystackAccessCode?: string;

  @Field({ nullable: true })
  paystackTransactionId?: string;

  @Field({ nullable: true })
  paystackChannel?: string;

  @Field({ nullable: true })
  paystackPaidAt?: Date;

  @Field()
  semester: Semester;

  @Field()
  session: string;

  @Field(() => PaymentMetadata, { nullable: true })
  metadata?: PaymentMetadata;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ResultAccess, { nullable: true })
  resultAccess?: any;
}

@InputType()
export class InitiatePaymentInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @Field()
  @IsNotEmpty()
  @IsEnum(Semester)
  semester: Semester;

  @Field()
  @IsNotEmpty()
  @IsString()
  session: string;

  @Field()
  @IsOptional()
  @IsString()
  paymentType?: PaymentType;

  @Field()
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

@ObjectType()
export class PaystackInitResponse {
  @Field()
  status: boolean;

  @Field()
  message: string;

  @Field(() => PaystackData, { nullable: true })
  data?: any;
}

@ObjectType()
export class PaystackData {
  @Field()
  authorizationUrl: string;

  @Field()
  accessCode: string;

  @Field()
  reference: string;
}

@ObjectType()
export class PaymentVerificationResponse {
  @Field()
  status: boolean;

  @Field()
  message: string;

  @Field(() => PaymentVerificationData, { nullable: true })
  data?: any;
}

@ObjectType()
export class PaymentVerificationData {
  @Field()
  reference: string;

  @Field()
  status: string;

  @Field(() => Float)
  amount: number;

  @Field()
  paidAt: Date;

  @Field()
  channel: string;
}

@ObjectType()
export class PaymentResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Payment, { nullable: true })
  payment?: Payment;

  @Field(() => ResultAccess, { nullable: true })
  resultAccess?: ResultAccess;

  @Field({ nullable: true })
  authorizationUrl?: string;

  @Field({ nullable: true })
  accessCode?: string;

  @Field({ nullable: true })
  reference?: string;
}

@ObjectType()
export class StudentPaymentSummary {
  @Field(() => Float)
  totalSpent: number;

  @Field(() => Int)
  totalTransactions: number;

  @Field(() => [Payment])
  recentPayments: Payment[];

  @Field(() => [ResultAccess])
  accessedResults: ResultAccess[];
}
