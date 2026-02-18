import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class RegisterFcmTokenDto {
  @Field()
  @IsString()
  token: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  platform?: string;
}
