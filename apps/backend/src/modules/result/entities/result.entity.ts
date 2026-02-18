import {
  ObjectType,
  Field,
  ID,
  InputType,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResultStatus, Semester, ApprovalStatus } from '@prisma/client';
import { Course } from '../../course/entities/course.entity';
import { Student } from '../../student/entities/student.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { User } from '../../../common/entities/user.entity';

// Define EditRequestStatus enum
enum EditRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(ResultStatus, { name: 'ResultStatus' });
registerEnumType(EditRequestStatus, { name: 'EditRequestStatus' });
registerEnumType(ApprovalStatus, { name: 'ApprovalStatus' });

@ObjectType()
export class Approval {
  @Field(() => ID)
  id: string;

  @Field()
  resultId: string;

  @Field(() => ApprovalStatus)
  hodStatus: ApprovalStatus;

  @Field({ nullable: true })
  hodApprovedById?: string;

  @Field({ nullable: true })
  hodApprovedAt?: Date;

  @Field({ nullable: true })
  hodRemarks?: string;

  @Field(() => ApprovalStatus)
  deanStatus: ApprovalStatus;

  @Field({ nullable: true })
  deanApprovedById?: string;

  @Field({ nullable: true })
  deanApprovedAt?: Date;

  @Field({ nullable: true })
  deanRemarks?: string;

  @Field(() => ApprovalStatus)
  senateStatus: ApprovalStatus;

  @Field({ nullable: true })
  senateApprovedById?: string;

  @Field({ nullable: true })
  senateApprovedAt?: Date;

  @Field({ nullable: true })
  senateRemarks?: string;

  @Field(() => User, { nullable: true })
  hodApprovedBy?: User;

  @Field(() => User, { nullable: true })
  deanApprovedBy?: User;

  @Field(() => User, { nullable: true })
  senateApprovedBy?: User;
}

@ObjectType()
export class Result {
  @Field(() => ID)
  id: string;

  @Field()
  studentId: string;

  @Field()
  courseId: string;

  @Field(() => Float, { nullable: true })
  ca?: number;

  @Field(() => Float, { nullable: true })
  exam?: number;

  @Field(() => Float)
  score: number;

  @Field()
  grade: string;

  @Field(() => Float)
  gradePoint: number;

  @Field(() => Float, { nullable: true })
  totalGradePoints?: number;

  @Field(() => ResultStatus)
  status: ResultStatus;

  @Field(() => Semester)
  semester: Semester;

  @Field()
  session: string;

  @Field()
  uploadedById: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => Student, { nullable: true })
  student?: Student;

  @Field(() => Staff, { nullable: true })
  uploadedBy?: Staff;

  @Field(() => [ResultEditRequest], { nullable: true })
  editRequests?: ResultEditRequest[];

  @Field(() => [ResultAudit], { nullable: true })
  audits?: ResultAudit[];

  @Field(() => Approval, { nullable: true })
  approval?: Approval;
}

@ObjectType()
export class ResultAudit {
  @Field(() => ID)
  id: string;

  @Field()
  resultId: string;

  @Field()
  action: string;

  @Field({ nullable: true })
  reason?: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field({ nullable: true })
  actorRole?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field(() => Result, { nullable: true })
  result?: Result;
}

@ObjectType()
export class ResultEditRequest {
  @Field(() => ID)
  id: string;

  @Field()
  resultId: string;

  @Field()
  reason: string;

  @Field(() => EditRequestStatus)
  status: EditRequestStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Result, { nullable: true })
  result?: Result;
}

@InputType()
export class SingleResultInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  ca?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(70)
  exam?: number;
}

@InputType()
export class UploadResultInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  semester?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  session?: string;

  @Field(() => [SingleResultInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleResultInput)
  results: SingleResultInput[];
}

@InputType()
export class UpdateResultInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  resultId: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  ca?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(70)
  exam?: number;
}

@InputType()
export class RequestEditInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  resultId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

@InputType()
export class HodApproveResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;
}

@InputType()
export class HodRejectResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

@InputType()
export class SubmitResultsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  semester: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  session: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resultIds?: string[];
}
@InputType()
export class DeanApproveResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;
}

@InputType()
export class DeanRejectResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}
@InputType()
export class SenateApproveResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;
}

@InputType()
export class SenateRejectResultsInput {
  @Field(() => [ID])
  @IsArray()
  @IsString({ each: true })
  resultIds: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}
