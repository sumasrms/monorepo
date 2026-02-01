import {
  ObjectType,
  Field,
  ID,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { EmploymentType, Gender } from '@prisma/client';
import { User } from '../../../common/entities/user.entity';

registerEnumType(EmploymentType, { name: 'EmploymentType' });

@ObjectType()
export class Staff {
  @Field(() => ID)
  id: string;

  @Field()
  staffNumber: string;

  @Field()
  institutionalRank: string;

  @Field({ nullable: true })
  designation?: string;

  @Field()
  dateOfBirth: Date;

  @Field()
  employmentDate: Date;

  @Field(() => EmploymentType)
  employmentType: EmploymentType;

  @Field({ nullable: true })
  departmentId?: string;

  @Field({ nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  specialization?: string;

  @Field(() => User)
  user: User;
}

@InputType()
export class CreateStaffInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  staffNumber: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  institutionalRank: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  designation?: string;

  @Field()
  @IsDate()
  dateOfBirth: Date;

  @Field()
  @IsDate()
  employmentDate: Date;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Field(() => EmploymentType, { defaultValue: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  credentialKey?: string;
}

@InputType()
export class UpdateStaffInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  institutionalRank?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  designation?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  employmentDate?: Date;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Field(() => EmploymentType, { nullable: true })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  departmentId?: string;
}

@ObjectType()
export class BulkUploadError {
  @Field()
  row: number;

  @Field()
  error: string;
}

@ObjectType()
export class BulkUploadResponse {
  @Field()
  successCount: number;

  @Field()
  errorCount: number;

  @Field(() => [BulkUploadError])
  errors: BulkUploadError[];
}
