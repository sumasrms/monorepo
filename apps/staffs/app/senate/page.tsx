"use client";

import {
  useUniversityStats,
  usePendingResultsForSenate,
} from "@/features/senate/hooks/useSenateUniversity";
import { useAcademicSettings } from "@/lib/graphql/session-hooks";
import {
  GraduationCap,
  Users,
  Building2,
  BarChart3,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

export default function SenateDashboard() {
  const { data: stats, isLoading: statsLoading } = useUniversityStats();
  const { data: pendingResults, isLoading: resultsLoading } =
    usePendingResultsForSenate();
  const { data: settingsData, isLoading: settingsLoading } =
    useAcademicSettings();

  if (statsLoading || resultsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentSettings = settingsData?.getAcademicSettings;

  const statCards = [
    {
      title: "Total Students",
      value: stats?.studentCount || 0,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Academic Staff",
      value: stats?.staffCount || 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Faculties",
      value: stats?.facultyCount || 0,
      icon: Building2,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Departments",
      value: stats?.departmentCount || 0,
      icon: Building2, // Using Building2 directly as it's imported
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  // Removed unused HomeIcon/DepartmentIcon helper as Building2 is used directly

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Institutional Dashboard
          </h1>
          <p className="text-muted-foreground">
            University-wide academic oversight and governance
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border rounded-xl px-4 py-2 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-muted-foreground">
            Session:{" "}
            {currentSettings?.currentSession?.session || "Not Configured"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="group p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold mt-1 tracking-tight">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Approvals Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Senate Approvals
            </h2>
            <Link
              href="/senate/approvals"
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            {pendingResults && pendingResults.length > 0 ? (
              pendingResults.slice(0, 5).map((result) => (
                <div
                  key={result.id}
                  className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">
                        {result.course.code} - {result.course.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/70">
                          {result.course.department.faculty.name}
                        </span>
                        <span>•</span>
                        <span>
                          {result.semester} Semester {result.session}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{result.score}%</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                        {result.approval?.deanApprovedBy?.name ||
                          "Dean Approved"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center rounded-xl border-2 border-dashed bg-muted/20">
                <FileCheck2 className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-muted-foreground">
                  No pending results for review
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid gap-4">
            <Link
              href="/senate/approvals"
              className="p-6 rounded-2xl border bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <ShieldCheck className="h-8 w-8 mb-4 opacity-20" />
              <h3 className="font-bold text-lg">Final Approval</h3>
              <p className="text-xs opacity-80 mt-1">
                Review and validate stage 4 results
              </p>
            </Link>

            <Link
              href="/senate/analytics"
              className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all w-fit">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-bold">Institutional Analytics</h3>
              <p className="text-xs text-muted-foreground mt-1">
                View university-wide metrics
              </p>
            </Link>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-600">
                    Senate Notice
                  </p>
                  <p className="text-xs text-orange-700/80 mt-1">
                    {pendingResults?.length || 0} result sets are awaiting final
                    approval for {currentSettings?.currentSession?.session ||
                      "the active session"}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
