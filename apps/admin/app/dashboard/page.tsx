"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_DASHBOARD_STATS,
  GET_DASHBOARD_ANALYTICS,
  GET_RECENT_ACTIVITIES,
} from "@/lib/graphql/dashboard";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";

export default function DashboardOverview() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => graphqlClient.request<any>(GET_DASHBOARD_STATS),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: () => graphqlClient.request<any>(GET_DASHBOARD_ANALYTICS),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: () => graphqlClient.request<any>(GET_RECENT_ACTIVITIES),
  });

  if (statsLoading || analyticsLoading || activityLoading) {
    return <div className="p-8">Loading dashboard metrics...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <OverviewStats stats={statsData?.dashboardStats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <OverviewChart
          data={analyticsData?.dashboardAnalytics?.studentsByFaculty}
        />
        <RecentActivities activities={activityData?.recentActivities || []} />
      </div>

      <QuickActions />
    </div>
  );
}
