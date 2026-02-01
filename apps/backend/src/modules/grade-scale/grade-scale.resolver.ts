import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { GradeScaleService } from './grade-scale.service';
import {
  GradeScale,
  CreateGradeScaleInput,
  UpdateGradeScaleInput,
} from './entities/grade-scale.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => GradeScale)
@UseGuards(AuthGuard, RolesGuard)
export class GradeScaleResolver {
  constructor(private readonly gradeScaleService: GradeScaleService) {}

  @Mutation(() => GradeScale)
  @Roles(roles.ADMIN)
  createGradeScale(@Args('input') input: CreateGradeScaleInput) {
    return this.gradeScaleService.create(input);
  }

  @Query(() => [GradeScale], { name: 'gradeScales' })
  findAllByDepartment(@Args('departmentId') departmentId: string) {
    return this.gradeScaleService.findAllByDepartment(departmentId);
  }

  @Query(() => GradeScale, { name: 'gradeScale' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.gradeScaleService.findOne(id);
  }

  @Mutation(() => GradeScale)
  @Roles(roles.ADMIN)
  updateGradeScale(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateGradeScaleInput,
  ) {
    return this.gradeScaleService.update(id, input);
  }

  @Mutation(() => GradeScale)
  @Roles(roles.ADMIN)
  removeGradeScale(@Args('id', { type: () => ID }) id: string) {
    return this.gradeScaleService.remove(id);
  }
}
