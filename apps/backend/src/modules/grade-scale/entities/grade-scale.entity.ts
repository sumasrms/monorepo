import { ObjectType, Field, ID, InputType, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

@ObjectType()
export class GradeScale {
  @Field(() => ID)
  id: string;

  @Field()
  departmentId: string;

  @Field()
  grade: string;

  @Field(() => Float)
  minScore: number;

  @Field(() => Float)
  maxScore: number;

  @Field(() => Float)
  gradePoint: number;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateGradeScaleInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  grade: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(10.0)
  gradePoint: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}

@InputType()
export class UpdateGradeScaleInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  grade?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxScore?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(10.0)
  @IsOptional()
  gradePoint?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}
