import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { StudentService } from './student.service';
import {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  BulkUploadStudentResponse,
} from './entities/student.entity';
import { Enrollment } from './entities/enrollment.entity';
import { User } from 'src/common/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';
import { PaymentService } from '../payment/payment.service';
import {
  Payment,
  ResultAccess,
  StudentPaymentSummary,
} from '../payment/entities/payment.entity';

@Resolver(() => Student)
@UseGuards(AuthGuard, RolesGuard)
export class StudentResolver {
  constructor(
    private readonly studentService: StudentService,
    private readonly paymentService: PaymentService,
  ) {}

  @Mutation(() => Student)
  @Roles(roles.ADMIN)
  createStudent(@Args('input') input: CreateStudentInput) {
    return this.studentService.create(input);
  }

  @Query(() => [Student], { name: 'students' })
  findAll() {
    return this.studentService.findAll();
  }

  @Query(() => Student, { name: 'student' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.studentService.findOne(id);
  }

  @Mutation(() => Student)
  @Roles(roles.ADMIN)
  updateStudent(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStudentInput,
  ) {
    return this.studentService.update(id, input);
  }

  @Mutation(() => BulkUploadStudentResponse)
  @Roles(roles.ADMIN)
  bulkUploadStudents(
    @Args({ name: 'inputs', type: () => [CreateStudentInput] })
    inputs: CreateStudentInput[],
  ) {
    return this.studentService.bulkUpload(inputs);
  }

  @Query(() => [Payment])
  @Roles(roles.STUDENT)
  async studentPayments(
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

  @Query(() => StudentPaymentSummary)
  @Roles(roles.STUDENT)
  async studentPaymentSummary(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.paymentService.getPaymentSummary(studentId);
  }

  @Query(() => [Enrollment])
  @Roles(roles.STUDENT)
  async studentCourses(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.studentService.getStudentEnrollments(studentId);
  }

  @ResolveField(() => User)
  async user(@Parent() student: Student) {
    if (student.user) return student.user;
    const fullStudent = await this.studentService.findOne(student.id);
    return fullStudent.user;
  }
}
