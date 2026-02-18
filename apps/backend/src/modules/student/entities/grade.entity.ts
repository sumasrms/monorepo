import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Grade {
  @Field(() => ID)
  id: string;

  @Field()
  enrollmentId: string;

  @Field()
  studentId: string;

  @Field(() => Float)
  score: number;

  @Field()
  grade: string;

  @Field({ nullable: true })
  remarks?: string;

  @Field()
  gradedAt: Date;

  @Field()
  gradedBy: string;

  @Field()
  updatedAt: Date;
}
