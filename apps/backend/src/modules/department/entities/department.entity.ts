import { ObjectType, Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Faculty } from '../../faculty/entities/faculty.entity';
import { User } from '../../../common/entities/user.entity';

@ObjectType()
export class DepartmentStats {
  @Field(() => Int)
  studentCount: number;

  @Field(() => Int)
  staffCount: number;

  @Field(() => Int)
  courseCount: number;
}

@ObjectType()
export class Department {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  facultyId: string;

  @Field({ nullable: true })
  hodId?: string;

  @Field(() => Int)
  numberOfYears: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => DepartmentStats, { nullable: true })
  stats?: DepartmentStats;

  @Field(() => Faculty, { nullable: true })
  faculty?: Faculty;

  @Field(() => User, { nullable: true })
  hod?: User;
}

@InputType()
export class CreateDepartmentInput {
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

  @Field()
  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  hodId?: string;

  @Field(() => Int, { defaultValue: 4 })
  @IsInt()
  @Min(1)
  numberOfYears: number;
}

@InputType()
export class UpdateDepartmentInput {
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
  facultyId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  hodId?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  numberOfYears?: number;
}
