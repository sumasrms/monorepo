import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { StaffService } from './staff.service';
import {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
  BulkUploadResponse,
} from './entities/staff.entity';
import { User } from 'src/common/entities/user.entity';
import { CourseInstructor } from '../course/entities/course.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => Staff)
@UseGuards(AuthGuard, RolesGuard)
export class StaffResolver {
  constructor(private readonly staffService: StaffService) {}

  @Mutation(() => Staff)
  @Roles(roles.ADMIN)
  createStaff(@Args('input') input: CreateStaffInput) {
    return this.staffService.create(input);
  }

  @Query(() => [Staff], { name: 'staffs' })
  findAll() {
    return this.staffService.findAll();
  }

  @Query(() => Staff, { name: 'staff' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.staffService.findOne(id);
  }

  @Query(() => [Staff], { name: 'staffByDepartment' })
  @Roles(roles.DEAN)
  async staffByDepartment(
    @Args('departmentId') departmentId: string,
    @Context() context: any,
  ) {
    const facultyId =
      context.req.user.staffProfile?.facultyId || context.req.user.facultyId;
    if (!facultyId) {
      throw new Error('Faculty not found for this user');
    }
    return this.staffService.getByDepartmentForFaculty(departmentId, facultyId);
  }

  @Mutation(() => Staff)
  @Roles(roles.ADMIN)
  updateStaff(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStaffInput,
  ) {
    return this.staffService.update(id, input);
  }

  @Mutation(() => Boolean)
  @Roles(roles.ADMIN)
  removeStaff(@Args('id', { type: () => ID }) id: string) {
    return this.staffService.remove(id);
  }

  @Mutation(() => BulkUploadResponse)
  @Roles(roles.ADMIN)
  bulkUploadStaff(
    @Args({ name: 'inputs', type: () => [CreateStaffInput] })
    inputs: CreateStaffInput[],
  ) {
    return this.staffService.bulkUpload(inputs);
  }

  @ResolveField(() => User)
  async user(@Parent() staff: Staff) {
    if (staff.user) return staff.user;
    const fullStaff = await this.staffService.findOne(staff.id);
    return fullStaff.user;
  }

  @ResolveField(() => [CourseInstructor], { nullable: true })
  async assignedCourses(@Parent() staff: Staff) {
    return this.staffService.getAssignedCourses(staff.id);
  }
}
