import { ObjectType, Field, Float } from '@nestjs/graphql';
import { AcademicSession } from './academic-session.entity';
import { Semester } from '@prisma/client';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(Semester, {
  name: 'Semester',
});

@ObjectType()
export class AcademicSettings {
  @Field()
  id: string;

  @Field({ nullable: true })
  currentSessionId?: string;

  @Field(() => AcademicSession, { nullable: true })
  currentSession?: AcademicSession;

  @Field(() => Semester)
  currentSemester: Semester;

  @Field()
  registrationOpen: boolean;

  @Field(() => Float)
  resultAccessFee: number;

  @Field(() => Float)
  lateRegistrationFee: number;

  @Field()
  resultPublishEnabled: boolean;

  @Field()
  maintenanceMode: boolean;

  @Field({ nullable: true })
  maintenanceMessage?: string;
}
