import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  Payment,
  ResultAccess,
  InitiatePaymentInput,
  PaymentResponse,
  StudentPaymentSummary,
} from './entities/payment.entity';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';
import { Semester } from '@prisma/client';

@Resolver(() => Payment)
@UseGuards(AuthGuard, RolesGuard)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentResponse)
  @Roles(roles.STUDENT)
  async initiatePayment(@Args('input') input: InitiatePaymentInput) {
    const result = await this.paymentService.initiatePayment(input);
    return {
      success: result.success,
      message: result.message,
      payment: result.payment,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
    };
  }

  @Mutation(() => PaymentResponse)
  @Roles(roles.STUDENT)
  async verifyPayment(@Args('reference') reference: string) {
    const result = await this.paymentService.verifyPayment(reference);
    return {
      success: result.success,
      message: result.message,
      payment: result.payment,
      resultAccess: result.resultAccess,
    };
  }

  @Query(() => [Payment])
  @Roles(roles.STUDENT)
  async paymentHistory(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.paymentService.getPaymentHistory(studentId);
  }

  @Query(() => [ResultAccess])
  @Roles(roles.STUDENT)
  async studentResultAccess(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.paymentService.getResultAccessByStudent(studentId);
  }

  @Query(() => Boolean)
  @Roles(roles.STUDENT)
  async canAccessResults(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('semester', { type: () => Semester }) semester: Semester,
    @Args('session') session: string,
  ) {
    return this.paymentService.canAccessResults(studentId, semester, session);
  }

  @Query(() => StudentPaymentSummary)
  @Roles(roles.STUDENT)
  async paymentSummary(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.paymentService.getPaymentSummary(studentId);
  }

  @ResolveField(() => ResultAccess, { nullable: true })
  async paymentResultAccess(@Parent() payment: Payment) {
    if (payment.resultAccess) return payment.resultAccess;
    // Lazy load if needed
    return null;
  }
}

@Resolver(() => ResultAccess)
@UseGuards(AuthGuard, RolesGuard)
export class ResultAccessResolver {
  @ResolveField(() => Payment)
  async payment(@Parent() resultAccess: ResultAccess) {
    if (resultAccess.payment) return resultAccess.payment;
    // Lazy load if needed
    return null;
  }
}
