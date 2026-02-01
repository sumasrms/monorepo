import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SystemSettings {
  @Field(() => String)
  id: string;

  @Field(() => String)
  key: string;

  @Field(() => String)
  value: string;

  @Field(() => String)
  category: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
