"use client";

import { useMyFacultyAnalytics } from "@/features/dean/hooks/useDeanFaculty";
import {
  BarChart3,
  Building2,
  TrendingUp,
  Users,
  Award,
  Clock,
  ArrowUpRight,
  PieChart,
} from "lucide-react";

type DepartmentMetric = {
  id: string;
  name: string;
  code: string;
  avgGPA: number;
  passRate: number;
  submissionRate: number;
  pendingApprovals: number;
  anomalyCount: number;
};

type LevelMetric = {
  name: string;
  avgGPA: number;
  passRate: number;
};

type DepartmentCount = {
  id: string;
  name: string;
  code: string;
  count: number;
};

export default function DeanAnalyticsPage() {
  const { data: analytics, isLoading } = useMyFacultyAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Analytics</h1>
        <p className="text-muted-foreground">
          Cross-departmental performance metrics and trends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Award className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              +1.2%
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Avg. Faculty GPA
          </h3>
          <p className="text-3xl font-bold mt-1">
            {analytics?.avgGPA.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Faculty-wide average
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Stable
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Submission Rate
          </h3>
          <p className="text-3xl font-bold mt-1">
            {analytics?.submissionRate.toFixed(1) || "0.0"}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Of expected course results
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Student Success
          </h3>
          <p className="text-3xl font-bold mt-1">
            {analytics?.passRate.toFixed(1) || "0.0"}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Pass rate across all levels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Department */}
        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <Building2 className="h-5 w-5 text-primary" />
            Departmental Breakdown
          </h3>
          <div className="space-y-6">
            {analytics?.departmentMetrics.map((dept: DepartmentMetric) => (
              <div key={dept.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{dept.name}</span>
                  <span className="text-muted-foreground">
                    {dept.avgGPA.toFixed(2)} Avg GP
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(dept.avgGPA / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Level Stats */}
        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <PieChart className="h-5 w-5 text-primary" />
            Level Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {analytics?.levelPerformance.map((level: LevelMetric) => (
              <div
                key={level.name}
                className="p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  {level.name}
                </p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-2xl font-bold">
                    {level.avgGPA.toFixed(2)}
                  </p>
                  <div className="h-8 w-1.5 bg-primary/40 rounded-full" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {level.passRate.toFixed(1)}% pass
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            Pending Approvals by Department
          </h3>
          <div className="space-y-4">
            {analytics?.pendingApprovalsByDepartment.map(
              (dept: DepartmentCount) => (
              <div key={dept.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{dept.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {dept.code}
                  </p>
                </div>
                <span className="text-sm font-bold">{dept.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            Anomaly Counts by Department
          </h3>
          <div className="space-y-4">
            {analytics?.anomalyCountsByDepartment.map(
              (dept: DepartmentCount) => (
              <div key={dept.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{dept.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {dept.code}
                  </p>
                </div>
                <span className="text-sm font-bold">{dept.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
