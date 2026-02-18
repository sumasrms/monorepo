import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class FcmTokenParamDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}
