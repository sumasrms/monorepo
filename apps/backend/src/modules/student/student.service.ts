import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateStudentInput,
  UpdateStudentInput,
  BulkUploadStudentResponse,
} from './entities/student.entity';
import { auth } from 'lib/auth';
import { roles } from 'lib/permissions';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.student.findMany({
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(input: CreateStudentInput) {
    const {
      name,
      email,
      matricNumber,
      admissionDate,
      level,
      gender,
      departmentId,
      programId,
      credentialKey,
    } = input;

    // Check if matricNumber already exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { matricNumber },
    });
    if (existingStudent) {
      throw new ConflictException('Matric number already exists');
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
          role: roles.STUDENT,
          gender: gender as any, // Cast to match enum
          departmentId,
          studentId: matricNumber,
        },
      });

      // Create student profile
      const studentData: any = {
        user: { connect: { id: user.id } },
        matricNumber,
        admissionDate,
        level,
        programId,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
      };

      return tx.student.create({
        data: studentData,
        include: {
          user: true,
        },
      });
    });
  }

  async update(id: string, input: UpdateStudentInput) {
    const student = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (input.name || input.gender || input.departmentId) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            name: input.name,
            gender: input.gender as any,
            departmentId: input.departmentId,
          },
        });
      }

      const studentUpdateData: any = {
        matricNumber: input.matricNumber,
        admissionDate: input.admissionDate,
        level: input.level,
        programId: input.programId,
        department: input.departmentId
          ? { connect: { id: input.departmentId } }
          : undefined,
      };

      return tx.student.update({
        where: { id },
        data: studentUpdateData,
        include: {
          user: true,
        },
      });
    });
  }

  async bulkUpload(
    inputs: CreateStudentInput[],
  ): Promise<BulkUploadStudentResponse> {
    const response: BulkUploadStudentResponse = {
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
          error: error.message || 'Unknown error',
        });
      }
    }

    return response;
  }
}
