import {
  ObjectType,
  Field,
  ID,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';
import { Semester, CourseType } from '@prisma/client';
import { Department } from '../../department/entities/department.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Enrollment } from '../../student/entities/enrollment.entity';

registerEnumType(Semester, { name: 'Semester' });
registerEnumType(CourseType, { name: 'CourseType' });

@ObjectType()
export class Course {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  credits: number;

  @Field()
  departmentId: string;

  @Field(() => Semester)
  semester: Semester;

  @Field()
  academicYear: string;

  @Field(() => Int)
  level: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Department, { nullable: true })
  department?: Department;

  @Field(() => [CourseInstructor], { nullable: true })
  instructors?: CourseInstructor[];

  @Field(() => [DepartmentCourse], { nullable: true })
  departmentOfferings?: DepartmentCourse[];

  @Field(() => [Enrollment], { nullable: true })
  enrollments?: Enrollment[];
}

@ObjectType()
export class CourseInstructor {
  @Field(() => ID)
  id: string;

  @Field()
  courseId: string;

  @Field()
  instructorId: string;

  @Field()
  isPrimary: boolean;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => Staff, { nullable: true })
  instructor?: Staff;
}

@ObjectType()
export class DepartmentCourse {
  @Field(() => ID)
  id: string;

  @Field()
  departmentId: string;

  @Field()
  courseId: string;

  @Field(() => CourseType)
  courseType: CourseType;

  @Field(() => Semester, { nullable: true })
  semester?: Semester;

  @Field(() => Int, { nullable: true })
  level?: number;

  @Field({ nullable: true })
  academicYear?: string;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => Department, { nullable: true })
  department?: Department;
}

@InputType()
export class CreateCourseInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  credits: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @Field(() => Semester)
  @IsEnum(Semester)
  semester: Semester;

  @Field()
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @Field(() => Int, { defaultValue: 100 })
  @IsInt()
  @Min(100)
  level: number;
}

@InputType()
export class UpdateCourseInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  credits?: number;

  @Field(() => Semester, { nullable: true })
  @IsEnum(Semester)
  @IsOptional()
  semester?: Semester;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(100)
  @IsOptional()
  level?: number;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class AssignInstructorInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  instructorId: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isPrimary: boolean;
}

@InputType()
export class BorrowCourseInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @Field(() => CourseType, { defaultValue: CourseType.ELECTIVE })
  @IsEnum(CourseType)
  courseType: CourseType;

  @Field(() => Semester, { nullable: true })
  @IsEnum(Semester)
  @IsOptional()
  semester?: Semester;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  level?: number;
}
@InputType()
export class EnrollStudentsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @Field(() => Int)
  @IsInt()
  @Min(100)
  @IsNotEmpty()
  level: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  semester: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  session: string;
}

@ObjectType()
export class EnrollmentResult {
  @Field(() => Int)
  enrolledCount: number;

  @Field(() => Int, { nullable: true })
  totalStudents?: number;

  @Field(() => Int, { nullable: true })
  totalCourses?: number;

  @Field()
  message: string;
}

@ObjectType()
export class ValidationResult {
  @Field()
  isValid: boolean;

  @Field({ nullable: true })
  reason?: string;
}

@ObjectType()
export class AssignInstructorResult {
  @Field(() => CourseInstructor)
  assignment: CourseInstructor;

  @Field({ nullable: true })
  warning?: string;
}