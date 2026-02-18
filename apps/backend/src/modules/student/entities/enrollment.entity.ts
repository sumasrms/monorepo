import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { EnrollmentStatus } from '@prisma/client';
import { Student } from '../../student/entities/student.entity';
import { Course } from '../../course/entities/course.entity';
import { Grade } from './grade.entity';

registerEnumType(EnrollmentStatus, { name: 'EnrollmentStatus' });

@ObjectType()
export class Enrollment {
  @Field(() => ID)
  id: string;

  @Field()
  studentId: string;

  @Field()
  courseId: string;

  @Field(() => EnrollmentStatus)
  status: EnrollmentStatus;

  @Field()
  enrolledAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Student, { nullable: true })
  student?: Student;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => Grade, { nullable: true })
  grade?: Grade;
}
