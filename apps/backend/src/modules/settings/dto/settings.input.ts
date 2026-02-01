import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class UpdateSettingInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  key: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  category?: string;
}

@InputType()
export class GetSettingInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  key: string;
}

@InputType()
export class GetSettingsByCategoryInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  category: string;
}
