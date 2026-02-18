import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from './entities/department.entity';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDepartmentInput) {
    const existing = await this.prisma.department.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(
        `Department with code ${data.code} already exists`,
      );
    }

    try {
      return await this.prisma.department.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          if (field === 'hodId') {
            throw new ConflictException(
              'This staff member is already assigned as Head of Department for another department.',
            );
          }
          throw new ConflictException(
            `A department with this ${field} already exists.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        faculty: true,
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        faculty: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, data: UpdateDepartmentInput) {
    const department = await this.findOne(id);

    if (data.hodId && data.hodId !== department.hodId) {
      const existingHod = await this.prisma.department.findFirst({
        where: {
          hodId: data.hodId,
          id: { not: id },
        },
        select: { id: true, name: true, code: true },
      });

      if (existingHod) {
        throw new ConflictException(
          `This staff member is already assigned as Head of Department for ${existingHod.name} (${existingHod.code}).`,
        );
      }
    }

    try {
      return await this.prisma.department.update({
        where: { id },
        data,
      });
    } catch (error) {
      // Handle Prisma unique constraint errors gracefully
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          if (field === 'hodId') {
            throw new ConflictException(
              'This staff member is already assigned as Head of Department for another department.',
            );
          }
          throw new ConflictException(
            `A department with this ${field} already exists.`,
          );
        }

        // Handle other Prisma errors
        if (error.code === 'P2025') {
          throw new NotFoundException('Department not found.');
        }
      }

      // For any other error, throw a generic error without exposing internals
      throw new ConflictException(
        'Unable to update department. Please try again.',
      );
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.department.delete({
      where: { id },
    });
  }

  async findByCode(code: string) {
    const department = await this.prisma.department.findUnique({
      where: { code },
      include: {
        faculty: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with code ${code} not found`);
    }

    return department;
  }

  async getStats(departmentId: string) {
    const [studentCount, staffCount, courseCount] = await Promise.all([
      this.prisma.student.count({
        where: { departmentId },
      }),
      this.prisma.staff.count({
        where: { departmentId },
      }),
      this.prisma.course.count({
        where: { departmentId },
      }),
    ]);

    return {
      studentCount,
      staffCount,
      courseCount,
    };
  }

  async getFaculty(facultyId: string) {
    return this.prisma.faculty.findUnique({
      where: { id: facultyId },
    });
  }
}
