"use client";

import { useMyDepartmentStats } from "@/features/results/hooks/useResults";
import { usePendingResultsByDepartment } from "@/features/results/hooks/useResults";
import { useSession } from "@/lib/auth-client";
import { StatCard } from "@workspace/ui/components/stat-card";
import {
  ActivityList,
  ActivityItem,
} from "@workspace/ui/components/activity-list";
import {
  BookOpen,
  Users,
  FileEdit,
  CheckCircle,
  Clock,
  LayoutDashboard,
} from "lucide-react";

export default function HodDashboard() {
  const { data: session } = useSession();
  const { data: stats, isLoading: statsLoading } = useMyDepartmentStats();
  const { data: pendingResults, isLoading: pendingLoading } =
    usePendingResultsByDepartment();

  const activityItems: ActivityItem[] =
    pendingResults?.map((result) => ({
      id: result.id,
      title: `Pending Approval: ${result.course.code}`,
      description: `${result.student.user.name} - ${result.score} (${result.grade}) uploaded by ${result.uploadedBy?.user.name}`,
      timestamp: new Date(result.createdAt).toLocaleDateString(),
      icon: Clock,
      status: "pending",
    })) || [];

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Please log in to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">HOD Dashboard</h1>
        <p className="text-muted-foreground">Department Overview & Approvals</p>
      </div>

      {/* Stats */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-4">
        <StatCard
          title="Total Students"
          value={statsLoading ? "..." : stats?.studentCount || 0}
          trend={{ label: "Registered", direction: "up" }}
          footerLabel="Enrolled in Department"
          footerIcon={Users}
        />

        <StatCard
          title="Total Courses"
          value={statsLoading ? "..." : stats?.courseCount || 0}
          trend={{ label: "Active", direction: "up" }}
          footerLabel="Departmental Courses"
          footerIcon={BookOpen}
        />

        <StatCard
          title="Pending Results"
          value={pendingLoading ? "..." : pendingResults?.length || 0}
          trend={{ label: "Awaiting Action", direction: "down" }}
          footerLabel="Results to Review"
          footerIcon={CheckCircle}
        />

        <StatCard
          title="Department Staff"
          value={statsLoading ? "..." : stats?.staffCount || 0}
          trend={{ label: "Active", direction: "up" }}
          footerLabel="Lecturers & Staff"
          footerIcon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Pending Results */}
        <div className="rounded-xl border p-6 bg-card shadow-sm">
          <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
            Pending Results
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
              New Uploads
            </span>
          </h2>
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activityItems.length > 0 ? (
            <ActivityList items={activityItems.slice(0, 5)} />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No results pending approval
            </div>
          )}
        </div>

        {/* Shortcuts or other info */}
        <div className="rounded-xl border p-6 bg-card shadow-sm border-dashed flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Access common departmental tasks
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Review Results
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">
              Manage Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
