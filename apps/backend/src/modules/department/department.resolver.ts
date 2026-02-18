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
import { DepartmentService } from './department.service';
import {
  Department,
  DepartmentStats,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from './entities/department.entity';
import { Faculty } from '../faculty/entities/faculty.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => Department)
@UseGuards(AuthGuard, RolesGuard)
export class DepartmentResolver {
  constructor(private readonly departmentService: DepartmentService) {}

  @Mutation(() => Department)
  @Roles(roles.ADMIN)
  createDepartment(@Args('input') input: CreateDepartmentInput) {
    return this.departmentService.create(input);
  }

  @Query(() => [Department], { name: 'departments' })
  findAll() {
    return this.departmentService.findAll();
  }

  @Query(() => Department, { name: 'department' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.departmentService.findOne(id);
  }

  @Mutation(() => Department)
  @Roles(roles.ADMIN)
  updateDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDepartmentInput,
  ) {
    return this.departmentService.update(id, input);
  }

  @Mutation(() => Department)
  @Roles(roles.ADMIN)
  removeDepartment(@Args('id', { type: () => ID }) id: string) {
    return this.departmentService.remove(id);
  }

  @Query(() => Department, { name: 'departmentByCode' })
  findByCode(@Args('code') code: string) {
    return this.departmentService.findByCode(code);
  }

  @Query(() => Department, { name: 'facultyDepartment' })
  @Roles(roles.DEAN)
  async findFacultyDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ) {
    const facultyId =
      context.req.user.staffProfile?.facultyId || context.req.user.facultyId;
    if (!facultyId) {
      throw new Error('Faculty not found for this user');
    }

    const department = await this.departmentService.findOne(id);
    if (department.facultyId !== facultyId) {
      throw new Error('Department not found for this faculty');
    }
    return department;
  }

  @ResolveField(() => DepartmentStats)
  async stats(@Parent() department: Department) {
    return this.departmentService.getStats(department.id);
  }

  @ResolveField(() => Faculty, { nullable: true })
  async faculty(@Parent() department: Department) {
    if (department.faculty) return department.faculty;
    // Fallback if not included by service find method
    return await this.departmentService.getFaculty(department.facultyId);
  }
}
