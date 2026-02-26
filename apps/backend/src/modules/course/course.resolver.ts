import { CourseService } from './course.service';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Parent,
  ResolveField,
  Context,
} from '@nestjs/graphql';
import {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  AssignInstructorInput,
  BorrowCourseInput,
  CourseInstructor,
  DepartmentCourse,
  EnrollStudentsInput,
  EnrollmentResult,
  ValidationResult,
  AssignInstructorResult,
  AssignCourseToStaffInput,
} from './entities/course.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';
import { Department } from '../department/entities/department.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Enrollment } from '../student/entities/enrollment.entity';
// import { Department } from '../../department/entities/department.entity';

@Resolver(() => Course)
@UseGuards(AuthGuard, RolesGuard)
export class CourseResolver {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CourseInstructor)
  @Roles(roles.HOD)
  async assignCourseToStaff(
    @Args('input') input: AssignCourseToStaffInput,
    @Context() context: { req: { user: { id: string } } },
  ) {
    // HOD userId from context
    const hodUserId: string = context.req.user.id;
    const { courseId, staffId, isPrimary } = input as AssignCourseToStaffInput;
    return await this.courseService.assignCourseToStaff({
      hodUserId,
      courseId,
      staffId,
      isPrimary,
    });
  }

  @Mutation(() => Course)
  @Roles(roles.ADMIN)
  createCourse(@Args('input') input: CreateCourseInput) {
    return this.courseService.create(input);
  }

  @Query(() => [Course], { name: 'courses' })
  findAll() {
    return this.courseService.findAll();
  }

  @Query(() => Course, { name: 'course' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.courseService.findOne(id);
  }

  @Query(() => Course, { name: 'courseByCode' })
  findByCode(@Args('code') code: string) {
    return this.courseService.findByCode(code);
  }

  @Query(() => [Staff], { name: 'eligibleCourseInstructors' })
  @Roles(roles.ADMIN)
  eligibleCourseInstructors(
    @Args('courseId', { type: () => ID }) courseId: string,
  ) {
    return this.courseService.getEligibleCourseInstructors(courseId);
  }

  @Mutation(() => Course)
  @Roles(roles.ADMIN)
  updateCourse(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCourseInput,
  ) {
    return this.courseService.update(id, input);
  }

  @Mutation(() => Course)
  @Roles(roles.ADMIN)
  removeCourse(@Args('id', { type: () => ID }) id: string) {
    return this.courseService.remove(id);
  }

  @Mutation(() => AssignInstructorResult)
  @Roles(roles.ADMIN)
  async assignInstructor(@Args('input') input: AssignInstructorInput) {
    return this.courseService.assignInstructorWithCurriculumCheck(
      input.courseId,
      input.instructorId,
      input.isPrimary,
    );
  }

  @Mutation(() => Boolean)
  @Roles(roles.ADMIN)
  async borrowCourse(@Args('input') input: BorrowCourseInput) {
    await this.courseService.borrowCourse(input);
    return true;
  }

  @Mutation(() => Boolean)
  @Roles(roles.ADMIN)
  async removeCourseFromDepartment(
    @Args('departmentId') departmentId: string,
    @Args('courseId') courseId: string,
  ) {
    await this.courseService.removeCourseFromDepartment(departmentId, courseId);
    return true;
  }

  @Mutation(() => EnrollmentResult)
  @Roles(roles.ADMIN)
  async enrollStudentsInCurriculumBatch(
    @Args('input') input: EnrollStudentsInput,
  ) {
    return this.courseService.enrollStudentsInCurriculumBatch(
      input.departmentId,
      input.level,
      input.semester,
    );
  }

  @Query(() => ValidationResult)
  @Roles(roles.STUDENT)
  async validateStudentCourseRegistration(
    @Args('studentId') studentId: string,
    @Args('courseId') courseId: string,
    @Args('semester') semester: string,
  ) {
    return this.courseService.validateStudentCourseRegistration(
      studentId,
      courseId,
      semester,
    );
  }

  @Query(() => [DepartmentCourse], { name: 'departmentOfferings' })
  async getOfferings(@Args('departmentId') departmentId: string) {
    return this.courseService.getOfferings(departmentId);
  }

  @Query(() => [DepartmentCourse], { name: 'myDepartmentOfferings' })
  @Roles(roles.HOD)
  async getMyOfferings(
    @Context()
    context: {
      req: { user: { staffProfile?: { departmentId?: string } } };
    },
  ) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.courseService.getOfferings(departmentId);
  }

  @ResolveField(() => Department, { nullable: true })
  async department(@Parent() course: Course) {
    if (course.department) return course.department;
    return this.courseService.getDepartment(course.departmentId);
  }

  @ResolveField(() => [CourseInstructor], { nullable: true })
  async instructors(@Parent() course: Course) {
    if (course.instructors) return course.instructors;
    return this.courseService.getInstructors(course.id);
  }

  @ResolveField(() => [DepartmentCourse], { nullable: true })
  async departmentOfferings(@Parent() course: Course) {
    if (course.departmentOfferings) return course.departmentOfferings;
    return this.courseService.getCourseOfferings(course.id);
  }

  @ResolveField(() => [Enrollment], { nullable: true })
  async enrollments(@Parent() course: Course) {
    if (course.enrollments) return course.enrollments;
    return this.courseService.getEnrollments(course.id);
  }
}
