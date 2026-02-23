import {
  ObjectType,
  Field,
  ID,
  InputType,
  PartialType,
  Int,
  Float,
} from '@nestjs/graphql';
import {
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from '../../../common/entities/user.entity';
import { Department } from '../../department/entities/department.entity';

@ObjectType()
export class Student {
  @Field(() => ID)
  id: string;

  @Field()
  matricNumber: string;

  @Field()
  admissionDate: Date;

  @Field(() => Int)
  level: number;

  @Field({ nullable: true })
  programId?: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => Department, { nullable: true })
  department?: Department;

  @Field(() => Float, { nullable: true })
  cgpa?: number;
}

@InputType()
export class CreateStudentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  matricNumber: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  admissionDate: Date;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  level: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @Field()
  @IsString()
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  credentialKey?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  programId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  nationality?: string = 'Nigeria';

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  stateOfOrigin?: string;
}

@InputType()
export class UpdateStudentInput extends PartialType(CreateStudentInput) {}

@ObjectType()
export class BulkUploadStudentError {
  @Field(() => Int)
  row: number;

  @Field()
  error: string;
}

@ObjectType()
export class BulkUploadStudentResponse {
  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  errorCount: number;

  @Field(() => [BulkUploadStudentError])
  errors: BulkUploadStudentError[];
}
