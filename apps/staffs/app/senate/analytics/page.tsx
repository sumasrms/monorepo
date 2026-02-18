"use client";

import { useUniversityAnalytics } from "@/features/senate/hooks/useSenateUniversity";
import {
  TrendingUp,
  Award,
  Clock,
  PieChart,
  Target,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export default function SenateAnalyticsPage() {
  const { data: analytics, isLoading } = useUniversityAnalytics();

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

  const ShieldBadgeIcon = ShieldCheck;

  const totalResults =
    analytics?.gradeDistribution.reduce((sum, item) => sum + item.value, 0) ||
    0;
  const avgGpaAcrossLevels = analytics?.avgGPByLevel.length
    ? analytics.avgGPByLevel.reduce((sum, level) => sum + level.value, 0) /
      analytics.avgGPByLevel.length
    : 0;
  const topLevel = analytics?.avgGPByLevel?.length
    ? analytics.avgGPByLevel.reduce((best, current) =>
        current.value > best.value ? current : best,
      )
    : undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Institutional Performance
          </h1>
          <p className="text-muted-foreground">
            University-wide academic trends and quality metrics
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold ring-1 ring-blue-500/20">
          <LineChart className="h-3.5 w-3.5" />
          Live Trend Analysis
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
              <Award className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {totalResults.toLocaleString()} results
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Univ. Pass Rate
          </h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {analytics?.passRate.toFixed(1)}%
          </p>
          <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${analytics?.passRate}%` }}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Avg. GPA (All Levels)
          </h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {avgGpaAcrossLevels.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Based on approved results
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Target className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Levels Covered
          </h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {analytics?.avgGPByLevel.length || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Active academic levels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grade Distribution */}
        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Global Grade Distribution
            </h3>
            <div className="px-3 py-1 bg-muted rounded-lg text-[10px] font-black uppercase text-muted-foreground">
              All Students
            </div>
          </div>

          <div className="space-y-6">
            {analytics?.gradeDistribution.map((grade) => (
              <div key={grade.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black flex items-center gap-2 w-8 text-primary">
                    {grade.name}
                  </span>
                  <span className="text-muted-foreground font-bold">
                    {grade.value.toLocaleString()} Results
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      grade.name === "F"
                        ? "bg-destructive"
                        : grade.name === "A"
                          ? "bg-primary"
                          : "bg-primary/40",
                    )}
                    style={{ width: `${(grade.value / maxGradeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance by Level */}
        <div className="p-8 rounded-2xl border bg-card shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <TrendingUp className="h-5 w-5 text-primary" />
            Institutional GPA by Level
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {analytics?.avgGPByLevel.map((level) => (
              <div
                key={level.name}
                className="p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all group"
              >
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                  {level.name}
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black group-hover:text-primary transition-colors">
                    {level.value.toFixed(2)}
                  </p>
                  <div
                    className={cn(
                      "h-10 w-2 rounded-full",
                      level.value > 3.5
                        ? "bg-green-500"
                        : level.value > 2.5
                          ? "bg-blue-500"
                          : "bg-yellow-500",
                    )}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 font-bold">
                  Level GPA
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
              <ShieldBadgeIcon className="h-4 w-4" />
              Senate Quality Assurance
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Highest average GPA: {topLevel?.name || "Level"} at
              {" "}{topLevel ? topLevel.value.toFixed(2) : "0.00"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
