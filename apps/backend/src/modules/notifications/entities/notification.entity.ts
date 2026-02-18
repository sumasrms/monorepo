import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  data?: any;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class NotificationSettings {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  systemInApp: boolean;

  @Field()
  systemEmail: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class FcmToken {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  token: string;

  @Field({ nullable: true })
  deviceId?: string;

  @Field({ nullable: true })
  platform?: string;

  @Field()
  createdAt: Date;
}
