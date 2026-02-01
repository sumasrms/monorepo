import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateGradeScaleInput,
  UpdateGradeScaleInput,
} from './entities/grade-scale.entity';

@Injectable()
export class GradeScaleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateGradeScaleInput) {
    const existing = await this.prisma.gradeScale.findUnique({
      where: {
        departmentId_grade: {
          departmentId: data.departmentId,
          grade: data.grade,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Grade scale for grade ${data.grade} already exists in this department`,
      );
    }

    return this.prisma.gradeScale.create({
      data,
    });
  }

  async findAllByDepartment(departmentId: string) {
    return this.prisma.gradeScale.findMany({
      where: { departmentId },
      orderBy: { minScore: 'desc' },
    });
  }

  async findOne(id: string) {
    const scale = await this.prisma.gradeScale.findUnique({
      where: { id },
    });

    if (!scale) {
      throw new NotFoundException(`Grade scale with ID ${id} not found`);
    }

    return scale;
  }

  async update(id: string, data: UpdateGradeScaleInput) {
    await this.findOne(id);

    return this.prisma.gradeScale.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.gradeScale.delete({
      where: { id },
    });
  }
}
