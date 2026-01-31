import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { FacultyService } from './faculty.service';
import {
  Faculty,
  FacultyStats,
  CreateFacultyInput,
  UpdateFacultyInput,
} from './entities/faculty.entity';
import { Department } from '../department/entities/department.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => Faculty)
@UseGuards(AuthGuard, RolesGuard)
export class FacultyResolver {
  constructor(private readonly facultyService: FacultyService) {}

  @Mutation(() => Faculty)
  @Roles(roles.ADMIN)
  createFaculty(@Args('input') input: CreateFacultyInput) {
    return this.facultyService.create(input);
  }

  @Query(() => [Faculty], { name: 'faculties' })
  findAll() {
    return this.facultyService.findAll();
  }

  @Query(() => Faculty, { name: 'faculty' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.facultyService.findOne(id);
  }

  @Mutation(() => Faculty)
  @Roles(roles.ADMIN)
  updateFaculty(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFacultyInput,
  ) {
    return this.facultyService.update(id, input);
  }

  @Mutation(() => Faculty)
  @Roles(roles.ADMIN)
  removeFaculty(@Args('id', { type: () => ID }) id: string) {
    return this.facultyService.remove(id);
  }

  @Query(() => Faculty, { name: 'facultyByCode' })
  findByCode(@Args('code') code: string) {
    return this.facultyService.findByCode(code);
  }

  @ResolveField(() => FacultyStats)
  async stats(@Parent() faculty: Faculty) {
    return this.facultyService.getStats(faculty.id);
  }

  @ResolveField(() => [Department], { nullable: true })
  async departments(@Parent() faculty: Faculty) {
    if (faculty.departments) return faculty.departments;
    return await this.facultyService.getDepartments(faculty.id);
  }
}
