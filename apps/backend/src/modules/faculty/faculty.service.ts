import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, ResultStatus } from '@prisma/client';
import {
  CreateFacultyInput,
  UpdateFacultyInput,
} from './entities/faculty.entity';
import { normalizeCode } from '../../common/utils/code.util';
import { roles } from 'lib/permissions';

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFacultyInput) {
    const normalized = { ...data, code: normalizeCode(data.code) };
    try {
      return await this.prisma.faculty.create({
        data: normalized,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          throw new ConflictException(
            `A faculty with this ${field} already exists.`,
          );
        }
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
        dean: true,
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return faculty;
  }

  async update(id: string, data: UpdateFacultyInput) {
    const faculty = await this.findOne(id);

    if (data.deanId != null && data.deanId !== '') {
      const user = await this.prisma.user.findUnique({
        where: { id: data.deanId },
        select: { id: true, role: true, name: true },
      });
      if (!user) {
        throw new NotFoundException(
          'Selected user not found. Please select a staff member from the list.',
        );
      }
      if (user.role !== roles.DEAN) {
        throw new BadRequestException(
          `Only users with the Dean role can be assigned as Dean of Faculty. "${user.name}" does not have the Dean role. Please assign the Dean role first (e.g. via Staff profile), or choose another staff member who has the Dean role.`,
        );
      }
      const staffInFaculty = await this.prisma.staff.findFirst({
        where: { userId: data.deanId, department: { facultyId: id } },
        select: { id: true },
      });
      if (!staffInFaculty) {
        throw new BadRequestException(
          'The selected user must be a staff member of this faculty. Only staff who belong to a department in this faculty can be assigned as Dean.',
        );
      }
      if (data.deanId !== faculty.deanId) {
        const existingDean = await this.prisma.faculty.findFirst({
          where: { deanId: data.deanId, id: { not: id } },
          select: { id: true, name: true, code: true },
        });
        if (existingDean) {
          throw new ConflictException(
            `This user is already the Dean of ${existingDean.name} (${existingDean.code}). Please choose another staff member, or remove them from that faculty first.`,
          );
        }
      }
    }

    const payload = { ...data };
    if (payload.code != null) payload.code = normalizeCode(payload.code);

    try {
      const updated = await this.prisma.faculty.update({
        where: { id },
        data: payload,
        include: { dean: true, departments: true },
      });
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          const field = target?.[0] || 'field';
          throw new ConflictException(
            `A faculty with this ${field} already exists.`,
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Faculty not found.');
        }
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
    const normalizedCode = normalizeCode(code);
    let faculty = await this.prisma.faculty.findUnique({
      where: { code: normalizedCode },
      include: { departments: true, dean: true },
    });
    if (!faculty && code !== normalizedCode) {
      faculty = await this.prisma.faculty.findUnique({
        where: { code },
        include: { departments: true, dean: true },
      });
    }

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

  async getDeanUser(deanId: string) {
    return this.prisma.user.findUnique({
      where: { id: deanId },
    });
  }

  /**
   * Staff with Dean role who belong to this faculty (via their department).
   * Used for Dean assignment: only staff in a department of this faculty and with Dean role can be assigned.
   */
  async getEligibleDeanStaff(facultyId: string) {
    const staffs = await this.prisma.staff.findMany({
      where: { department: { facultyId } },
      include: {
        user: {
          include: {
            managedFaculty: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return staffs.filter((s) => s.user.role === roles.DEAN);
  }

  async getAnalytics(facultyId: string) {
    const settings = await this.prisma.settings.findFirst({
      include: { currentSession: true },
    });

    const currentSession = settings?.currentSession?.session;
    const currentSemester = settings?.currentSemester;

    const [departments, courses] = await Promise.all([
      this.prisma.department.findMany({
        where: { facultyId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.course.findMany({
        where: { department: { facultyId } },
        select: { id: true, departmentId: true },
      }),
    ]);

    const coursesByDepartment = new Map<string, number>();
    courses.forEach((course) => {
      coursesByDepartment.set(
        course.departmentId,
        (coursesByDepartment.get(course.departmentId) || 0) + 1,
      );
    });

    const resultFilters: Prisma.ResultWhereInput = {
      course: { department: { facultyId } },
      ...(currentSession ? { session: currentSession } : {}),
      ...(currentSemester ? { semester: currentSemester } : {}),
    };

    const results = await this.prisma.result.findMany({
      where: resultFilters,
      include: {
        student: true,
        course: {
          select: {
            departmentId: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const gradeDistributionMap: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };

    let passCount = 0;
    let totalGp = 0;

    const levelMap = new Map<
      number,
      { totalGp: number; count: number; pass: number }
    >();
    const semesterMap = new Map<
      string,
      { totalGp: number; count: number; pass: number }
    >();
    const deptMap = new Map<
      string,
      {
        info: { id: string; name: string; code: string };
        totalGp: number;
        count: number;
        pass: number;
        anomalyCount: number;
        submittedCourseIds: Set<string>;
      }
    >();

    const analyzeAnomalies = (result: any) => {
      const issues: string[] = [];
      const ca = result.ca;
      const exam = result.exam;
      const score = result.score;

      if (
        ca === null ||
        ca === undefined ||
        exam === null ||
        exam === undefined
      ) {
        issues.push('Missing CA/Exam');
      }

      if (!result.grade) {
        issues.push('Missing Grade');
      }

      const computedScore = (ca || 0) + (exam || 0);
      if (score === null || score === undefined) {
        issues.push('Missing Score');
      } else if (Math.abs(score - computedScore) > 0.5) {
        issues.push('Score Mismatch');
      }

      if (
        score < 0 ||
        score > 100 ||
        (ca || 0) < 0 ||
        (ca || 0) > 30 ||
        (exam || 0) < 0 ||
        (exam || 0) > 70
      ) {
        issues.push('Out of Range');
      }

      if (result.gradePoint < 0 || result.gradePoint > 5) {
        issues.push('Invalid Grade Point');
      }

      return issues;
    };

    results.forEach((result) => {
      if (gradeDistributionMap[result.grade] !== undefined) {
        gradeDistributionMap[result.grade] += 1;
      }

      if (result.grade !== 'F') {
        passCount += 1;
      }

      totalGp += result.gradePoint || 0;

      const level = result.student?.level || 100;
      const levelEntry = levelMap.get(level) || {
        totalGp: 0,
        count: 0,
        pass: 0,
      };
      levelEntry.totalGp += result.gradePoint || 0;
      levelEntry.count += 1;
      if (result.grade !== 'F') {
        levelEntry.pass += 1;
      }
      levelMap.set(level, levelEntry);

      const semester = result.semester as string;
      const semesterEntry = semesterMap.get(semester) || {
        totalGp: 0,
        count: 0,
        pass: 0,
      };
      semesterEntry.totalGp += result.gradePoint || 0;
      semesterEntry.count += 1;
      if (result.grade !== 'F') {
        semesterEntry.pass += 1;
      }
      semesterMap.set(semester, semesterEntry);

      const dept = result.course?.department;
      if (dept) {
        const deptEntry = deptMap.get(dept.id) || {
          info: { id: dept.id, name: dept.name, code: dept.code },
          totalGp: 0,
          count: 0,
          pass: 0,
          anomalyCount: 0,
          submittedCourseIds: new Set<string>(),
        };

        deptEntry.totalGp += result.gradePoint || 0;
        deptEntry.count += 1;
        if (result.grade !== 'F') {
          deptEntry.pass += 1;
        }

        deptEntry.submittedCourseIds.add(result.courseId);
        deptEntry.anomalyCount += analyzeAnomalies(result).length;

        deptMap.set(dept.id, deptEntry);
      }
    });

    const pendingResults = await this.prisma.result.findMany({
      where: {
        status: ResultStatus.HOD_APPROVED,
        course: { department: { facultyId } },
        ...(currentSession ? { session: currentSession } : {}),
        ...(currentSemester ? { semester: currentSemester } : {}),
      },
      include: {
        course: {
          select: {
            departmentId: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const pendingMap = new Map<
      string,
      { info: { id: string; name: string; code: string }; count: number }
    >();
    pendingResults.forEach((result) => {
      const dept = result.course?.department;
      if (!dept) return;
      const entry = pendingMap.get(dept.id) || {
        info: { id: dept.id, name: dept.name, code: dept.code },
        count: 0,
      };
      entry.count += 1;
      pendingMap.set(dept.id, entry);
    });

    const totalCourseCount = courses.length || 0;
    const totalSubmittedCourses = new Set(results.map((r) => r.courseId)).size;
    const submissionRate =
      totalCourseCount > 0
        ? (totalSubmittedCourses / totalCourseCount) * 100
        : 0;

    const departmentMetrics = departments.map((dept) => {
      const entry = deptMap.get(dept.id);
      const totalCourses = coursesByDepartment.get(dept.id) || 0;
      const submitted = entry?.submittedCourseIds.size || 0;
      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        avgGPA:
          entry && entry.count > 0
            ? Number((entry.totalGp / entry.count).toFixed(2))
            : 0,
        passRate:
          entry && entry.count > 0
            ? Number(((entry.pass / entry.count) * 100).toFixed(1))
            : 0,
        submissionRate:
          totalCourses > 0
            ? Number(((submitted / totalCourses) * 100).toFixed(1))
            : 0,
        pendingApprovals: pendingMap.get(dept.id)?.count || 0,
        anomalyCount: entry?.anomalyCount || 0,
      };
    });

    const levelPerformance = Array.from(levelMap.entries())
      .map(([level, data]) => ({
        name: `${level} Level`,
        avgGPA:
          data.count > 0 ? Number((data.totalGp / data.count).toFixed(2)) : 0,
        passRate:
          data.count > 0
            ? Number(((data.pass / data.count) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const semesterPerformance = Array.from(semesterMap.entries())
      .map(([name, data]) => ({
        name: name.replace('_', ' '),
        avgGPA:
          data.count > 0 ? Number((data.totalGp / data.count).toFixed(2)) : 0,
        passRate:
          data.count > 0
            ? Number(((data.pass / data.count) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const pendingApprovalsByDepartment = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      count: pendingMap.get(dept.id)?.count || 0,
    }));

    const anomalyCountsByDepartment = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      count: deptMap.get(dept.id)?.anomalyCount || 0,
    }));

    const passRate =
      results.length > 0 ? (passCount / results.length) * 100 : 0;
    const avgGPA = results.length > 0 ? totalGp / results.length : 0;

    return {
      avgGPA: Number(avgGPA.toFixed(2)),
      passRate: Number(passRate.toFixed(1)),
      submissionRate: Number(submissionRate.toFixed(1)),
      departmentMetrics,
      levelPerformance,
      semesterPerformance,
      pendingApprovalsByDepartment,
      anomalyCountsByDepartment,
    };
  }
}
