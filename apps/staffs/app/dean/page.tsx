"use client";

import {
  useMyFacultyStats,
  usePendingResultsByFaculty,
} from "@/features/dean/hooks/useDeanFaculty";
import { StatCard } from "@workspace/ui/components/stat-card";
import {
  Building2,
  Users,
  BookOpen,
  CheckCircle,
  BarChart3,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DeanDashboard() {
  const { data: stats, isLoading: statsLoading } = useMyFacultyStats();
  const { data: pendingResults, isLoading: resultsLoading } =
    usePendingResultsByFaculty();

  if (statsLoading || resultsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = pendingResults?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">
          Faculty-level oversight and result approval management
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Departments"
          value={stats?.departmentCount || 0}
          footerLabel="Active departments"
          footerIcon={Building2}
        />
        <StatCard
          title="Total Staff"
          value={stats?.staffCount || 0}
          footerLabel="Academic & non-academic"
          footerIcon={Users}
        />
        <StatCard
          title="Total Students"
          value={stats?.studentCount || 0}
          footerLabel="Faculty-wide enrollment"
          footerIcon={Users}
        />
        <StatCard
          title="Course Offerings"
          value={stats?.courseCount || 0}
          footerLabel="Current semester"
          footerIcon={BookOpen}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Approvals Quick View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Pending Approvals
            </h2>
            <Link
              href="/dean/approvals"
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            {pendingCount > 0 ? (
              <div className="divide-y">
                {pendingResults?.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {result.course.code} - {result.student.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          {result.course.department.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                        {result.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No pending results for faculty-level review</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <h3 className="font-bold text-lg mb-2">Needs Your Attention</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              There are <span className="font-bold">{pendingCount}</span> result
              sets that have been approved by HODs and require your review.
            </p>
            <Link
              href="/dean/approvals"
              className="w-full py-2 bg-white text-primary rounded-lg text-sm font-bold flex items-center justify-center hover:bg-white/90 transition-all"
            >
              Start Review Session
            </Link>
          </div>

          <div className="p-6 rounded-xl border bg-card space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Faculty Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-green-100 text-green-700 rounded-lg mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-bold">Analytics Ready</p>
                  <p className="text-[10px] text-muted-foreground">
                    Semester performance reports have been generated for all
                    departments.
                  </p>
                </div>
              </div>
              <Link
                href="/dean/analytics"
                className="block w-full py-2 border rounded-lg text-sm font-bold text-center hover:bg-muted transition-all"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
