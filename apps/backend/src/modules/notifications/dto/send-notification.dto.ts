import { InputType, Field } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import type { JsonValue } from '../types/notification-payload.type';

@InputType()
export class SendNotificationDto {
  @Field()
  @IsString()
  userId: string;

  @Field(() => String)
  @IsEnum(NotificationType)
  type: NotificationType;

  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  message: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  data?: JsonValue;

  @Field({ nullable: true })
  @IsOptional()
  sendInApp?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  sendEmail?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  sendPush?: boolean;
}
