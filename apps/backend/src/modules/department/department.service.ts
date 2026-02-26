import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from './entities/department.entity';
import { normalizeCode } from '../../common/utils/code.util';
import { roles } from 'lib/permissions';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDepartmentInput) {
    const normalizedCode = normalizeCode(data.code);
    const existing = await this.prisma.department.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException(
        `Department with code ${data.code} already exists`,
      );
    }

    try {
      return await this.prisma.department.create({
        data: { ...data, code: normalizedCode },
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
        hod: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, data: UpdateDepartmentInput) {
    const department = await this.findOne(id);

    if (data.hodId != null && data.hodId !== '') {
      const user = await this.prisma.user.findUnique({
        where: { id: data.hodId },
        select: { id: true, role: true, name: true },
      });
      if (!user) {
        throw new NotFoundException(
          'Selected user not found. Please select a staff member from the list.',
        );
      }

      if (user.role !== roles.HOD) {
        throw new BadRequestException(
          `Only users with the HOD role can be assigned as Head of Department. "${user.name}" does not have the HOD role. Please assign the HOD role to this user first (e.g. via Staff profile or role management), or choose another staff member who has the HOD role.`,
        );
      }

      const staffInDept = await this.prisma.staff.findFirst({
        where: { userId: data.hodId, departmentId: id },
        select: { id: true },
      });
      if (!staffInDept) {
        throw new BadRequestException(
          'The selected user must be a staff member of this department. Only staff who belong to this department can be assigned as Head of Department.',
        );
      }

      if (data.hodId !== department.hodId) {
        const existingHod = await this.prisma.department.findFirst({
          where: {
            hodId: data.hodId,
            id: { not: id },
          },
          select: { id: true, name: true, code: true },
        });

        if (existingHod) {
          throw new ConflictException(
            `This user is already the Head of Department for ${existingHod.name} (${existingHod.code}). Please choose another staff member, or remove them from that department first.`,
          );
        }
      }
    }

    const payload: Record<string, unknown> = { ...data };
    if (payload.code != null) payload.code = normalizeCode(payload.code as string);
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      const updated = await this.prisma.department.update({
        where: { id },
        data: payload as Prisma.DepartmentUpdateInput,
        include: { hod: true, faculty: true },
      });
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          if (field === 'hodId') {
            throw new ConflictException(
              'This user is already the Head of Department for another department. One user can only be HOD of one department at a time.',
            );
          }
          throw new ConflictException(
            `A department with this ${field} already exists.`,
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Department not found.');
        }
      }
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
    const normalizedCode = normalizeCode(code);
    let department = await this.prisma.department.findUnique({
      where: { code: normalizedCode },
      include: { faculty: true, hod: true },
    });
    if (!department && code !== normalizedCode) {
      department = await this.prisma.department.findUnique({
        where: { code },
        include: { faculty: true, hod: true },
      });
    }

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

  async getHodUser(hodId: string) {
    return this.prisma.user.findUnique({
      where: { id: hodId },
    });
  }

  /**
   * Staff with HOD role who belong to this department.
   * Used for HOD assignment: only staff in the department and with HOD role can be assigned.
   */
  async getEligibleHodStaff(departmentId: string) {
    const staffs = await this.prisma.staff.findMany({
      where: { departmentId },
      include: {
        user: {
          include: {
            managedDepartment: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return staffs.filter((s) => s.user.role === roles.HOD);
  }
}
