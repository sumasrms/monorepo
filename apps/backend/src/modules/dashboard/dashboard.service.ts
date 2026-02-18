import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  DashboardStats,
  DashboardAnalytics,
  RecentActivity,
} from './entities/dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [
      studentCount,
      staffCount,
      courseCount,
      departmentCount,
      facultyCount,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.staff.count(),
      this.prisma.course.count(),
      this.prisma.department.count(),
      this.prisma.faculty.count(),
    ]);

    return {
      studentCount,
      staffCount,
      courseCount,
      departmentCount,
      facultyCount,
    };
  }

  async getAnalytics(): Promise<DashboardAnalytics> {
    // Since student -> department -> faculty, we need to aggregate properly.
    // However, Prisma groupBy is limited on joined relations.
    // A simpler approach for "Students per Faculty" chart:
    // Fetch all faculties with their student counts via relation count.

    const faculties = await this.prisma.faculty.findMany({
      include: {
        departments: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    const studentsByFaculty = faculties.map((faculty) => {
      const totalStudents = faculty.departments.reduce(
        (acc, dept) => acc + dept._count.students,
        0,
      );
      return {
        name: faculty.code, // using code for shorter labels on chart
        value: totalStudents,
      };
    });

    return {
      studentsByFaculty,
    };
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    // Fetch recent 5 items from key tables
    const [recentStudents, recentStaff, recentCourses] = await Promise.all([
      this.prisma.student.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.staff.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.course.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const activities: RecentActivity[] = [];

    recentStudents.forEach((student) => {
      activities.push({
        id: student.id,
        type: 'STUDENT',
        description: `New student enrolled: ${student.user.name} (${student.matricNumber})`,
        timestamp: student.createdAt,
      });
    });

    recentStaff.forEach((staff) => {
      activities.push({
        id: staff.id,
        type: 'STAFF',
        description: `New staff joined: ${staff.user.name}`,
        timestamp: staff.createdAt,
      });
    });

    recentCourses.forEach((course) => {
      activities.push({
        id: course.id,
        type: 'COURSE',
        description: `New course created: ${course.code} - ${course.title}`,
        timestamp: course.createdAt,
      });
    });

    // Sort by timestamp desc and take top 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }

  async getDepartmentStats(departmentId: string): Promise<DashboardStats> {
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
      departmentCount: 1, // Only the HOD's department
      facultyCount: 1, // Only the HOD's faculty
    };
  }

  async getDepartmentAnalytics(departmentId: string) {
    const results = await this.prisma.result.findMany({
      where: {
        course: {
          departmentId,
        },
      },
      include: {
        student: true,
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
    const levelGPAMap: Record<number, { totalGP: number; count: number }> = {};

    results.forEach((r) => {
      if (gradeDistributionMap[r.grade] !== undefined) {
        gradeDistributionMap[r.grade]++;
      }
      if (r.grade !== 'F') {
        passCount++;
      }

      const level = r.student?.level || 100;
      if (!levelGPAMap[level]) {
        levelGPAMap[level] = { totalGP: 0, count: 0 };
      }
      levelGPAMap[level].totalGP += r.gradePoint;
      levelGPAMap[level].count++;
    });

    const gradeDistribution = Object.entries(gradeDistributionMap).map(
      ([name, value]) => ({ name, value }),
    );

    const passRate =
      results.length > 0 ? (passCount / results.length) * 100 : 0;

    const avgGPByLevel = Object.entries(levelGPAMap)
      .map(([level, data]) => ({
        name: `Level ${level}`,
        value: Number((data.totalGP / data.count).toFixed(2)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      gradeDistribution,
      passRate,
      avgGPByLevel,
    };
  }

  async getUniversityAnalytics() {
    const results = await this.prisma.result.findMany({
      include: {
        student: true,
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
    const levelGPAMap: Record<number, { totalGP: number; count: number }> = {};

    results.forEach((r) => {
      if (gradeDistributionMap[r.grade] !== undefined) {
        gradeDistributionMap[r.grade]++;
      }
      if (r.grade !== 'F') {
        passCount++;
      }

      const level = r.student?.level || 100;
      if (!levelGPAMap[level]) {
        levelGPAMap[level] = { totalGP: 0, count: 0 };
      }
      levelGPAMap[level].totalGP += r.gradePoint;
      levelGPAMap[level].count++;
    });

    const gradeDistribution = Object.entries(gradeDistributionMap).map(
      ([name, value]) => ({ name, value }),
    );

    const passRate =
      results.length > 0 ? (passCount / results.length) * 100 : 0;

    const avgGPByLevel = Object.entries(levelGPAMap)
      .map(([level, data]) => ({
        name: `Level ${level}`,
        value: Number((data.totalGP / data.count).toFixed(2)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      gradeDistribution,
      passRate,
      avgGPByLevel,
    };
  }
}
