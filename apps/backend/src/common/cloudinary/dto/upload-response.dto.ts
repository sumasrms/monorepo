import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadResponse {
  @Field(() => String)
  url: string;

  @Field(() => String)
  secureUrl: string;

  @Field(() => String)
  publicId: string;

  @Field(() => String, { nullable: true })
  format?: string;

  @Field(() => Number, { nullable: true })
  width?: number;

  @Field(() => Number, { nullable: true })
  height?: number;

  @Field(() => Number, { nullable: true })
  bytes?: number;

  @Field(() => String, { nullable: true })
  resourceType?: string;
}
