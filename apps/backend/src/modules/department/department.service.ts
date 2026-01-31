import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
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

    return this.prisma.department.create({
      data,
    });
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
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data,
    });
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
