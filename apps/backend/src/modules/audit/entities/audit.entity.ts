import {
  ObjectType,
  Field,
  ID,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { AuditCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';

registerEnumType(AuditCategory, { name: 'AuditCategory' });

@ObjectType()
export class AuditLog {
  @Field(() => ID)
  id: string;

  @Field(() => AuditCategory)
  category: AuditCategory;

  @Field()
  action: string;

  @Field({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field({ nullable: true })
  actorRole?: string;

  @Field({ nullable: true })
  reason?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: any;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class AuditLogFilterInput {
  @Field(() => AuditCategory, { nullable: true })
  @IsEnum(AuditCategory)
  @IsOptional()
  category?: AuditCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  actorId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  actorRole?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  action?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  from?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  to?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  take?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  skip?: number;
}
