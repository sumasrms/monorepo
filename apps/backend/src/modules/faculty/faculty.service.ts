import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateFacultyInput,
  UpdateFacultyInput,
} from './entities/faculty.entity';

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFacultyInput) {
    try {
      return await this.prisma.faculty.create({
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(
          `A faculty with this ${field} already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.faculty.findMany({
      include: {
        departments: true,
      },
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return faculty;
  }

  async update(id: string, data: UpdateFacultyInput) {
    await this.findOne(id);

    try {
      return await this.prisma.faculty.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(
          `A faculty with this ${field} already exists.`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Faculty not found.');
      }
      throw new ConflictException(
        'Unable to update faculty. Please try again.',
      );
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.faculty.delete({
      where: { id },
    });
  }

  async findByCode(code: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { code },
      include: {
        departments: true,
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with code ${code} not found`);
    }

    return faculty;
  }

  async getStats(facultyId: string) {
    const [studentCount, staffCount, courseCount, departmentCount] =
      await Promise.all([
        this.prisma.student.count({
          where: { department: { facultyId } },
        }),
        this.prisma.staff.count({
          where: { department: { facultyId } },
        }),
        this.prisma.course.count({
          where: { department: { facultyId } },
        }),
        this.prisma.department.count({
          where: { facultyId },
        }),
      ]);

    return {
      studentCount,
      staffCount,
      courseCount,
      departmentCount,
    };
  }

  async getDepartments(facultyId: string) {
    return this.prisma.department.findMany({
      where: { facultyId },
    });
  }
}
