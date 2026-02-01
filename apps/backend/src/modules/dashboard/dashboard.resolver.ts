import { Resolver, Query } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import {
  DashboardStats,
  DashboardAnalytics,
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
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD)
  getStats() {
    return this.dashboardService.getStats();
  }

  @Query(() => DashboardAnalytics, { name: 'dashboardAnalytics' })
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD)
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Query(() => [RecentActivity], { name: 'recentActivities' })
  @Roles(roles.ADMIN, roles.DEAN, roles.HOD)
  getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }
}
