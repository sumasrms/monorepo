import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateStaffInput,
  UpdateStaffInput,
  BulkUploadResponse,
} from './entities/staff.entity';
import { auth } from 'lib/auth';
import { roles } from 'lib/permissions';
import { Prisma } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async create(input: CreateStaffInput) {
    const {
      name,
      email,
      staffNumber,
      institutionalRank,
      designation,
      dateOfBirth,
      employmentDate,
      gender,
      employmentType,
      facultyId,
      departmentId,
      credentialKey,
    } = input;

    // Check if staffNumber or email already exists
    const existingStaff = await this.prisma.staff.findUnique({
      where: { staffNumber },
    });
    if (existingStaff) {
      throw new ConflictException('Staff number already exists');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create user using better-auth API to handle password hashing and account linking
      const { user } = await auth.api.createUser({
        body: {
          email,
          password: credentialKey || 'ChangeMe123!',
          name,
        },
      });

      // Update user details and role
      await tx.user.update({
        where: { id: user.id },
        data: {
          role: this.mapDesignationToRole(designation),
          gender,
          facultyId,
          departmentId,
          staffId: staffNumber,
        },
      });

      // Create staff profile
      const staffData: Prisma.StaffCreateInput = {
        user: { connect: { id: user.id } },
        staffNumber,
        institutionalRank,
        designation,
        dateOfBirth,
        employmentDate,
        employmentType,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
      };

      return tx.staff.create({
        data: staffData,
        include: {
          user: true,
        },
      });
    });
  }

  async update(id: string, input: UpdateStaffInput) {
    const staff = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const userUpdateData: Prisma.UserUpdateInput = {};
      if (input.name != null) userUpdateData.name = input.name;
      if (input.gender != null) userUpdateData.gender = input.gender;
      if (input.facultyId !== undefined) {
        userUpdateData.faculty = input.facultyId
          ? { connect: { id: input.facultyId } }
          : { disconnect: true };
      }
      if (input.departmentId !== undefined) {
        userUpdateData.department = input.departmentId
          ? { connect: { id: input.departmentId } }
          : { disconnect: true };
      }
      if (input.designation != null) {
        userUpdateData.role = this.mapDesignationToRole(input.designation);
      }
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: staff.userId },
          data: userUpdateData,
        });
      }

      const staffUpdateData: Prisma.StaffUpdateInput = {
        institutionalRank: input.institutionalRank,
        designation: input.designation,
        dateOfBirth: input.dateOfBirth,
        employmentDate: input.employmentDate,
        employmentType: input.employmentType,
        department: input.departmentId
          ? { connect: { id: input.departmentId } }
          : undefined,
      };

      return tx.staff.update({
        where: { id },
        data: staffUpdateData,
        include: {
          user: true,
        },
      });
    });
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.staff.delete({ where: { id } });
      await tx.user.delete({ where: { id: staff.userId } });
      return true;
    });
  }

  async bulkUpload(inputs: CreateStaffInput[]): Promise<BulkUploadResponse> {
    const response: BulkUploadResponse = {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (let i = 0; i < inputs.length; i++) {
      try {
        await this.create(inputs[i]);
        response.successCount++;
      } catch (error) {
        response.errorCount++;
        response.errors.push({
          row: i + 1,
          error: (error as Error).message || 'Unknown error',
        });
      }
    }

    return response;
  }

  async getAssignedCourses(staffId: string) {
    return this.prisma.courseInstructor.findMany({
      where: { instructorId: staffId },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        course: {
          code: 'asc',
        },
      },
    });
  }

  async getByDepartmentForFaculty(departmentId: string, facultyId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { facultyId: true },
    });

    if (!department || department.facultyId !== facultyId) {
      throw new NotFoundException('Department not found for this faculty');
    }

    return this.prisma.staff.findMany({
      where: { departmentId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private mapDesignationToRole(designation?: string): string {
    if (!designation) return roles.LECTURER;
    const d = designation.toLowerCase();
    if (d.includes('hod')) return roles.HOD;
    if (d.includes('dean')) return roles.DEAN;
    if (d.includes('senate')) return roles.SENATE;
    if (d.includes('registry')) return roles.REGISTRY;
    if (d.includes('exams')) return roles.EXAMS;
    return roles.LECTURER;
  }
}
