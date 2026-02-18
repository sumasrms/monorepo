import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class AcademicSession {
  @Field(() => ID)
  id: string;

  @Field()
  session: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  isCurrent: boolean;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
