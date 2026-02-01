import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(
          `A course with this ${field} already exists.`,
        );
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(
          `A course with this ${field} already exists.`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found.');
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
}
