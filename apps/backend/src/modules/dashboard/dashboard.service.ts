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
    const studentsByFacultyRaw = await this.prisma.student.groupBy({
      by: ['departmentId'],
      _count: {
        id: true,
      },
      where: {
        departmentId: { not: null },
      },
    });

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
}
