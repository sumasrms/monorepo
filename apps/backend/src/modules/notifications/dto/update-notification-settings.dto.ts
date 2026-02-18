import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateNotificationSettingsDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  systemInApp?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  systemEmail?: boolean;
}
