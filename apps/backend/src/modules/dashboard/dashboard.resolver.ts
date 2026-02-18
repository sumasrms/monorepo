import { Resolver, Query, Context } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import {
  DashboardStats,
  DashboardAnalytics,
  DepartmentAnalytics,
  RecentActivity,
} from './entities/dashboard.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { roles } from 'lib/permissions';

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats, { name: 'dashboardStats' })
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD, roles.SENATE)
  getStats() {
    return this.dashboardService.getStats();
  }

  @Query(() => DashboardAnalytics, { name: 'dashboardAnalytics' })
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD, roles.SENATE)
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Query(() => [RecentActivity], { name: 'recentActivities' })
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD, roles.SENATE)
  getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Query(() => DashboardStats, { name: 'myDepartmentStats' })
  @Roles(roles.HOD)
  async getMyDepartmentStats(@Context() context: any) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    // We can reuse a method from DepartmentService or implement it here
    return this.dashboardService.getDepartmentStats(departmentId);
  }

  @Query(() => DepartmentAnalytics, { name: 'myDepartmentAnalytics' })
  @Roles(roles.HOD)
  async getMyDepartmentAnalytics(@Context() context: any) {
    const departmentId = context.req.user.staffProfile?.departmentId;
    if (!departmentId) {
      throw new Error('Department not found for this user');
    }
    return this.dashboardService.getDepartmentAnalytics(departmentId);
  }

  @Query(() => DepartmentAnalytics, { name: 'universityAnalytics' })
  @Roles(roles.SENATE, roles.ADMIN)
  async getUniversityAnalytics() {
    return this.dashboardService.getUniversityAnalytics();
  }
}
