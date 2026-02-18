"use client";

import { useMyDepartmentAnalytics } from "@/features/hod/hooks/useHodAnalytics";
import {
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react";

export default function HodAnalyticsPage() {
  const { data: analytics, isLoading } = useMyDepartmentAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxGradeCount = Math.max(
    ...(analytics?.gradeDistribution.map((g) => g.value) || [1]),
  );

  return (
    <div className="relative space-y-10">
      <div className="absolute inset-0 -z-10">
        <div className="h-56 w-full rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_40%_80%,rgba(251,146,60,0.16),transparent_50%)]" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            HOD Analytics
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Department Performance
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Spotlight on results, momentum, and grade composition for your
            department this session.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border bg-card px-4 py-2 text-xs font-semibold">
            Session: 2024/2025
          </div>
          <div className="rounded-full border bg-card px-4 py-2 text-xs font-semibold">
            Semester: Current
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[80px] bg-green-500/10" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-500/15 p-3 text-green-700">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Pass Rate
                </p>
                <p className="text-3xl font-black">
                  {analytics?.passRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
              <ArrowUpRight className="h-3 w-3" />
              +2.4%
            </span>
          </div>
          <div className="mt-5">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-1000"
                style={{ width: `${analytics?.passRate}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Compared to previous semester
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/15" />
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Avg. GP
              </p>
              <p className="text-3xl font-black">3.42</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Based on approved results this semester
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
            <ArrowUpRight className="h-3 w-3 text-blue-600" />
            +0.18 since last session
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute bottom-0 right-0 h-24 w-24 rounded-tl-[90px] bg-orange-500/10" />
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Active Lecturers
              </p>
              <p className="text-3xl font-black">12</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Staff contributing to results
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
            <ArrowDownRight className="h-3 w-3 text-orange-600" />
            -1 compared to last semester
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-3xl border bg-card p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Grade Distribution</h3>
                <p className="text-xs text-muted-foreground">
                  Spread across all results
                </p>
              </div>
            </div>
            <select className="rounded-full border bg-background px-3 py-1.5 text-xs font-semibold">
              <option>All Levels</option>
              <option>100 Level</option>
              <option>200 Level</option>
              <option>300 Level</option>
            </select>
          </div>

          <div className="mt-8 space-y-5">
            {analytics?.gradeDistribution.map((grade) => (
              <div key={grade.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sm font-bold">Grade {grade.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {grade.value} results
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/70">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      grade.name === "F"
                        ? "bg-destructive"
                        : grade.name === "E"
                          ? "bg-orange-400"
                          : grade.name === "A"
                            ? "bg-emerald-500"
                            : "bg-primary/70"
                    }`}
                    style={{ width: `${(grade.value / maxGradeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Avg. GPA by Level</h3>
                <p className="text-xs text-muted-foreground">
                  Current academic session
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {analytics?.avgGPByLevel.map((level) => (
                <div
                  key={level.name}
                  className="rounded-2xl border border-transparent bg-muted/40 p-4 transition-all hover:border-primary/30"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {level.name}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-black">{level.value}</p>
                    <div
                      className={`h-10 w-2 rounded-full ${
                        level.value > 3.5
                          ? "bg-emerald-500"
                          : level.value > 2.5
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <p className="mt-3 text-[10px] font-semibold text-muted-foreground">
                    +0.12 vs last semester
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-primary/5 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Insight</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  200 Level students show the highest progress this semester.
                  Consider reviewing the 300 Level curriculum for uplift.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
