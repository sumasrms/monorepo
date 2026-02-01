import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Gender } from '@prisma/client';

registerEnumType(Gender, { name: 'Gender' });

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;

  @Field({ nullable: true })
  image?: string;
}
