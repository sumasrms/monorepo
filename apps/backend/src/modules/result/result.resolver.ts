import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { ResultService } from './result.service';
import {
  Result,
  ResultAudit,
  ResultEditRequest,
  UploadResultInput,
  UpdateResultInput,
  RequestEditInput,
  HodApproveResultsInput,
  HodRejectResultsInput,
  DeanApproveResultsInput,
  DeanRejectResultsInput,
  SenateApproveResultsInput,
  SenateRejectResultsInput,
  SubmitResultsInput,
} from './entities/result.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver(() => Result)
@UseGuards(AuthGuard, RolesGuard)
export class ResultResolver {
  constructor(private readonly resultService: ResultService) {}

  @Mutation(() => [Result])
  @Roles(roles.LECTURER)
  async uploadResults(
    @Args('input') input: UploadResultInput,
    @Context() context: any,
  ) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.uploadResults(input, staffId);
  }

  @Mutation(() => Result)
  @Roles(roles.LECTURER)
  async updateResult(
    @Args('input') input: UpdateResultInput,
    @Context() context: any,
  ) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.updateResult(input, staffId);
  }

  @Mutation(() => [Result])
  @Roles(roles.LECTURER)
  async submitResultsToHod(
    @Args('input') input: SubmitResultsInput,
    @Context() context: any,
  ) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.submitResultsToHod(input, staffId);
  }

  @Mutation(() => ResultEditRequest)
  @Roles(roles.LECTURER)
  async requestResultEdit(
    @Args('input') input: RequestEditInput,
    @Context() context: any,
  ) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.requestEdit(input, staffId);
  }

  @Query(() => [ResultEditRequest])
  @Roles(roles.LECTURER)
  async myEditRequests(@Context() context: any) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.getEditRequests(staffId);
  }

  @Query(() => [Result])
  @Roles(roles.LECTURER, roles.HOD, roles.DEAN)
  async resultsByCourse(
    @Args('courseId') courseId: string,
    @Args('semester') semester: string,
    @Args('session') session: string,
  ) {
    return this.resultService.getResultsByCourse(courseId, semester, session);
  }

  @Query(() => [Result])
  @Roles(roles.STUDENT)
  async studentResults(
    @Args('studentId', { type: () => ID }) studentId: string,
  ) {
    return this.resultService.getResultsByStudent(studentId);
  }

  @Mutation(() => [Result])
  @Roles(roles.HOD)
  async hodApproveResults(
    @Args('input') input: HodApproveResultsInput,
    @Context() context: any,
  ) {
    const hodId = context.req.user.id; // Or staffProfile.id? The Approval model uses User relation for hodApprovedBy
    return this.resultService.hodApproveResults(input, hodId);
  }

  @Mutation(() => [Result])
  @Roles(roles.HOD)
  async hodRejectResults(
    @Args('input') input: HodRejectResultsInput,
    @Context() context: any,
  ) {
    const hodId = context.req.user.id;
    return this.resultService.hodRejectResults(input, hodId);
  }

  @Query(() => [Result])
  @Roles(roles.HOD)
  async pendingResultsByDepartment(@Context() context: any) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.resultService.getPendingResultsByDepartment(departmentId);
  }
  @Query(() => [ResultEditRequest])
  @Roles(roles.HOD)
  async pendingEditRequestsByDepartment(@Context() context: any) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.resultService.getPendingEditRequestsByDepartment(departmentId);
  }

  @Query(() => [Result])
  @Roles(roles.HOD)
  async resultsByDepartment(
    @Args('courseId', { type: () => String, nullable: true })
    courseId: string | null,
    @Args('semester', { type: () => String, nullable: true })
    semester: string | null,
    @Args('session', { type: () => String, nullable: true })
    session: string | null,
    @Context() context: any,
  ) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.resultService.getResultsByDepartment(departmentId, {
      courseId: courseId || undefined,
      semester: semester || undefined,
      session: session || undefined,
    });
  }

  @Query(() => [ResultAudit])
  @Roles(roles.HOD)
  async resultAuditsByDepartment(@Context() context: any) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.resultService.getResultAuditsByDepartment(departmentId);
  }

  @Query(() => [ResultAudit])
  @Roles(roles.LECTURER)
  async resultAuditsByCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ) {
    const staffId = context.req.user.staffProfile?.id;
    if (!staffId) {
      throw new Error('Staff profile not found');
    }
    return this.resultService.getResultAuditsByCourse(courseId, staffId);
  }

  @Mutation(() => ResultEditRequest)
  @Roles(roles.HOD)
  async approveEditRequest(@Args('id', { type: () => ID }) id: string) {
    return this.resultService.approveEditRequest(id);
  }

  @Mutation(() => ResultEditRequest)
  @Roles(roles.HOD)
  async rejectEditRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('remarks') remarks: string,
  ) {
    return this.resultService.rejectEditRequest(id, remarks);
  }

  @Query(() => [Result])
  @Roles(roles.DEAN)
  async pendingResultsByFaculty(@Context() context: any) {
    const facultyId =
      context.req.user.staffProfile?.facultyId || context.req.user.facultyId;
    if (!facultyId) {
      throw new Error('Faculty not found for this user');
    }
    return this.resultService.getPendingResultsByFaculty(facultyId);
  }

  @Query(() => [Result])
  @Roles(roles.DEAN)
  async resultsByFaculty(
    @Args('departmentId', { type: () => ID, nullable: true })
    departmentId: string | null,
    @Args('courseId', { type: () => String, nullable: true })
    courseId: string | null,
    @Args('semester', { type: () => String, nullable: true })
    semester: string | null,
    @Args('session', { type: () => String, nullable: true })
    session: string | null,
    @Context() context: any,
  ) {
    const facultyId =
      context.req.user.staffProfile?.facultyId || context.req.user.facultyId;
    if (!facultyId) {
      throw new Error('Faculty not found for this user');
    }

    return this.resultService.getResultsByFaculty(facultyId, {
      departmentId: departmentId || undefined,
      courseId: courseId || undefined,
      semester: semester || undefined,
      session: session || undefined,
    });
  }

  @Query(() => [ResultAudit])
  @Roles(roles.DEAN)
  async resultAuditsByFaculty(
    @Args('departmentId', { type: () => ID, nullable: true })
    departmentId: string | null,
    @Context() context: any,
  ) {
    const facultyId =
      context.req.user.staffProfile?.facultyId || context.req.user.facultyId;
    if (!facultyId) {
      throw new Error('Faculty not found for this user');
    }
    return this.resultService.getResultAuditsByFaculty(
      facultyId,
      departmentId || undefined,
    );
  }

  @Mutation(() => [Result])
  @Roles(roles.DEAN)
  async deanApproveResults(
    @Args('input') input: DeanApproveResultsInput,
    @Context() context: any,
  ) {
    const deanId = context.req.user.id;
    return this.resultService.deanApproveResults(input, deanId);
  }

  @Mutation(() => [Result])
  @Roles(roles.DEAN)
  async deanRejectResults(
    @Args('input') input: DeanRejectResultsInput,
    @Context() context: any,
  ) {
    const deanId = context.req.user.id;
    return this.resultService.deanRejectResults(input, deanId);
  }

  @Query(() => [Result])
  @Roles(roles.SENATE)
  async pendingResultsForSenate() {
    return this.resultService.getPendingResultsForSenate();
  }

  @Query(() => [ResultAudit])
  @Roles(roles.SENATE)
  async resultAuditsForSenate() {
    return this.resultService.getResultAuditsForSenate();
  }

  @Query(() => [Result])
  @Roles(roles.SENATE)
  async resultsForSenate(
    @Args('facultyId', { type: () => ID, nullable: true })
    facultyId: string | null,
    @Args('departmentId', { type: () => ID, nullable: true })
    departmentId: string | null,
    @Args('courseId', { type: () => String, nullable: true })
    courseId: string | null,
    @Args('semester', { type: () => String, nullable: true })
    semester: string | null,
    @Args('session', { type: () => String, nullable: true })
    session: string | null,
    @Args('status', { type: () => String, nullable: true })
    status: string | null,
  ) {
    return this.resultService.getResultsForSenate({
      facultyId: facultyId || undefined,
      departmentId: departmentId || undefined,
      courseId: courseId || undefined,
      semester: semester || undefined,
      session: session || undefined,
      status: status || undefined,
    });
  }

  @Mutation(() => [Result])
  @Roles(roles.SENATE)
  async senateApproveResults(
    @Args('input') input: SenateApproveResultsInput,
    @Context() context: any,
  ) {
    const senateId = context.req.user.id;
    return this.resultService.senateApproveResults(input, senateId);
  }

  @Mutation(() => [Result])
  @Roles(roles.SENATE)
  async senateRejectResults(
    @Args('input') input: SenateRejectResultsInput,
    @Context() context: any,
  ) {
    const senateId = context.req.user.id;
    return this.resultService.senateRejectResults(input, senateId);
  }

  @Mutation(() => Boolean)
  @Roles(roles.SENATE)
  async senatePublishResults(
    @Args('resultIds', { type: () => [ID] }) resultIds: string[],
  ) {
    await this.resultService.authorizePublication(resultIds);
    return true;
  }
}
