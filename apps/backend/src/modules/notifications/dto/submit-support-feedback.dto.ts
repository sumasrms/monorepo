import { Field, InputType } from '@nestjs/graphql';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class SubmitSupportFeedbackDto {
  @Field()
  @IsString()
  @IsIn(['SUPPORT', 'FEEDBACK'])
  type: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category: string;

  @Field()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority: string;

  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  portalType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  currentPath?: string;
}
