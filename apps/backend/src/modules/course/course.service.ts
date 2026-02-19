import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCourseInput,
  UpdateCourseInput,
  AssignInstructorInput,
  BorrowCourseInput,
} from './entities/course.entity';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCourseInput) {
    try {
      return await this.prisma.course.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          throw new ConflictException(
            `A course with this ${field} already exists.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        instructors: {
          include: {
            instructor: {
              include: {
                user: true,
              },
            },
          },
        },
        departmentOfferings: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async findByCode(code: string) {
    const course = await this.prisma.course.findUnique({
      where: { code },
      include: {
        department: true,
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with code ${code} not found`);
    }

    return course;
  }

  async update(id: string, data: UpdateCourseInput) {
    await this.findOne(id);

    try {
      return await this.prisma.course.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          throw new ConflictException(
            `A course with this ${field} already exists.`,
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Course not found.');
        }
      }
      throw new ConflictException('Unable to update course. Please try again.');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.course.delete({
      where: { id },
    });
  }

  async assignInstructor(data: AssignInstructorInput) {
    const { courseId, instructorId, isPrimary } = data;

    // Check if course and instructor exist
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const instructor = await this.prisma.staff.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    // If setting as primary, unset other primary instructors for this course
    if (isPrimary) {
      await this.prisma.courseInstructor.updateMany({
        where: { courseId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.courseInstructor.upsert({
      where: {
        courseId_instructorId: { courseId, instructorId },
      },
      update: { isPrimary },
      create: { courseId, instructorId, isPrimary },
    });
  }

  async borrowCourse(data: BorrowCourseInput) {
    const { courseId, departmentId, courseType, semester, level } = data;

    // Check if course and department exist
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) throw new NotFoundException('Department not found');

    return this.prisma.departmentCourse.upsert({
      where: {
        departmentId_courseId_semester_level: {
          departmentId,
          courseId,
          semester: semester || course.semester,
          level: level || course.level,
        },
      },
      update: { courseType },
      create: {
        departmentId,
        courseId,
        courseType,
        semester: semester || course.semester,
        level: level || course.level,
        academicYear: course.academicYear,
      },
    });
  }

  async getOfferings(departmentId: string) {
    return this.prisma.departmentCourse.findMany({
      where: { departmentId },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  async getDepartment(departmentId: string) {
    return this.prisma.department.findUnique({
      where: { id: departmentId },
    });
  }

  async getInstructors(courseId: string) {
    return this.prisma.courseInstructor.findMany({
      where: { courseId },
      include: {
        instructor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getCourseOfferings(courseId: string) {
    return this.prisma.departmentCourse.findMany({
      where: { courseId },
      include: {
        department: true,
      },
    });
  }

  async removeCourseFromDepartment(departmentId: string, courseId: string) {
    // Check if the relationship exists
    const existing = await this.prisma.departmentCourse.findFirst({
      where: {
        departmentId,
        courseId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Course is not assigned to this department');
    }

    return this.prisma.departmentCourse.deleteMany({
      where: {
        departmentId,
        courseId,
      },
    });
  }

  async getEnrollments(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Auto-enroll students in curriculum courses
   * Gets all students in a department at a specific level and enrolls them
   * in courses defined for that department, level, and semester
   */
  async enrollStudentsInCurriculumBatch(
    departmentId: string,
    level: number,
    semester: string,
    session: string,
  ) {
    // Check department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) throw new NotFoundException('Department not found');

    // Get all students in this department at this level
    const students = await this.prisma.student.findMany({
      where: {
        departmentId,
        level,
        status: 'ACTIVE',
      },
    });

    if (students.length === 0) {
      return {
        enrolledCount: 0,
        message: `No active students found at level ${level} in ${department.name}`,
      };
    }

    // Get curriculum courses for this department, level, and semester
    const curriculumCourses = await this.prisma.departmentCourse.findMany({
      where: {
        departmentId,
        level,
        semester: semester as any,
      },
      include: {
        course: true,
      },
    });

    if (curriculumCourses.length === 0) {
      return {
        enrolledCount: 0,
        message: `No curriculum courses found for level ${level} in ${semester} semester`,
      };
    }

    // Create enrollments for each student in each curriculum course
    let enrolledCount = 0;
    for (const student of students) {
      for (const { course } of curriculumCourses) {
        try {
          await this.prisma.enrollment.upsert({
            where: {
              studentId_courseId: {
                studentId: student.id,
                courseId: course.id,
              },
            },
            update: { status: 'ACTIVE' }, // Reactivate if previously inactive
            create: {
              studentId: student.id,
              courseId: course.id,
              status: 'ACTIVE',
            },
          });
          enrolledCount++;
        } catch (error) {
          // Skip if enrollment creation fails (e.g., already exists)
          continue;
        }
      }
    }

    return {
      enrolledCount,
      totalStudents: students.length,
      totalCourses: curriculumCourses.length,
      message: `Successfully enrolled ${enrolledCount} students in curriculum courses`,
    };
  }

  /**
   * Validate if a student can register for a course
   * Checks if the course is part of student's curriculum or an offering in their department
   */
  async validateStudentCourseRegistration(
    studentId: string,
    courseId: string,
    semester: string,
  ): Promise<{ isValid: boolean; reason?: string }> {
    // Check student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true },
    });
    if (!student) return { isValid: false, reason: 'Student not found' };
    if (!student.departmentId) {
      return { isValid: false, reason: 'Student has no department assigned' };
    }

    // Check course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return { isValid: false, reason: 'Course not found' };

    // Check if course is in student's curriculum (department + level + semester)
    const curriculumCourse = await this.prisma.departmentCourse.findFirst({
      where: {
        courseId,
        departmentId: student.departmentId,
        level: student.level,
        semester: semester as any,
      },
    });

    if (curriculumCourse) {
      return { isValid: true };
    }

    // As a fallback, allow if course is offered by the student's department
    // even if not in exact curriculum (supports cross-level electives)
    const departmentOffering = await this.prisma.departmentCourse.findFirst({
      where: {
        courseId,
        departmentId: student.departmentId,
      },
    });

    if (departmentOffering) {
      return {
        isValid: true,
        reason: 'Course is offered by department (not in curriculum)',
      };
    }

    return {
      isValid: false,
      reason: 'Course is not in your curriculum or offered by your department',
    };
  }

  /**
   * Check if assigning an instructor to a course matches curriculum
   * Returns warning if course is not in the instructor's department curriculum
   */
  async assignInstructorWithCurriculumCheck(
    courseId: string,
    instructorId: string,
    isPrimary: boolean,
  ) {
    // Get instructor's department
    const instructor = await this.prisma.staff.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');
    if (!instructor.departmentId) {
      throw new NotFoundException('Instructor has no department assigned');
    }

    // Get course details
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Check if course is in instructor's department curriculum
    const curriculumMatch = await this.prisma.departmentCourse.findFirst({
      where: {
        courseId,
        departmentId: instructor.departmentId,
      },
    });

    let warning: string | null = null;
    if (!curriculumMatch) {
      const department = await this.prisma.department.findUnique({
        where: { id: instructor.departmentId },
        select: { name: true },
      });
      warning = `Course "${course.code}" is not in ${department?.name}'s curriculum. Assigning ${instructor.id} as instructor anyway.`;
    }

    // Perform the assignment
    const assignment = await this.assignInstructor({
      courseId,
      instructorId,
      isPrimary,
    });

    return {
      assignment,
      warning,
    };
  }
}
