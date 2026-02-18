import { ObjectType, Field, ID, InputType, Int, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Department } from '../../department/entities/department.entity';
import { User } from '../../../common/entities/user.entity';

@ObjectType()
export class FacultyStats {
  @Field(() => Int)
  studentCount: number;

  @Field(() => Int)
  staffCount: number;

  @Field(() => Int)
  courseCount: number;

  @Field(() => Int)
  departmentCount: number;
}

@ObjectType()
export class FacultyDepartmentMetric {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => Float)
  avgGPA: number;

  @Field(() => Float)
  passRate: number;

  @Field(() => Float)
  submissionRate: number;

  @Field(() => Int)
  pendingApprovals: number;

  @Field(() => Int)
  anomalyCount: number;
}

@ObjectType()
export class FacultyDepartmentCount {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class FacultyLevelMetric {
  @Field()
  name: string;

  @Field(() => Float)
  avgGPA: number;

  @Field(() => Float)
  passRate: number;
}

@ObjectType()
export class FacultySemesterMetric {
  @Field()
  name: string;

  @Field(() => Float)
  avgGPA: number;

  @Field(() => Float)
  passRate: number;
}

@ObjectType()
export class FacultyAnalytics {
  @Field(() => Float)
  avgGPA: number;

  @Field(() => Float)
  passRate: number;

  @Field(() => Float)
  submissionRate: number;

  @Field(() => [FacultyDepartmentMetric])
  departmentMetrics: FacultyDepartmentMetric[];

  @Field(() => [FacultyLevelMetric])
  levelPerformance: FacultyLevelMetric[];

  @Field(() => [FacultySemesterMetric])
  semesterPerformance: FacultySemesterMetric[];

  @Field(() => [FacultyDepartmentCount])
  pendingApprovalsByDepartment: FacultyDepartmentCount[];

  @Field(() => [FacultyDepartmentCount])
  anomalyCountsByDepartment: FacultyDepartmentCount[];
}

@ObjectType()
export class Faculty {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  deanId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => FacultyStats, { nullable: true })
  stats?: FacultyStats;

  @Field(() => [Department], { nullable: true })
  departments?: Department[];

  @Field(() => User, { nullable: true })
  dean?: User;
}

@InputType()
export class CreateFacultyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deanId?: string;
}

@InputType()
export class UpdateFacultyInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  code?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deanId?: string;
}
