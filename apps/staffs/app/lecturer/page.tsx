"use client";

import { useAssignedCourses } from "@/features/lecturers/hooks/useLecturer";
import { useEditRequests } from "@/features/results/hooks/useResults";
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
  XCircle,
  Clock,
} from "lucide-react";

export default function LecturerDashboard() {
  const { data: session } = useSession();
  const staffId = (session?.user as any)?.staffProfile?.id;
  const { data: courses, isLoading: coursesLoading } = useAssignedCourses(
    staffId || "",
  );
  const { data: requests, isLoading: requestsLoading } = useEditRequests();

  const activityItems: ActivityItem[] =
    requests?.map((request) => ({
      id: request.id,
      title: `Result Edit Request: ${request.result.course.code}`,
      description: `Request for ${request.result.student.user.name} is ${request.status.toLowerCase()}`,
      timestamp: new Date(request.createdAt).toLocaleDateString(),
      icon:
        request.status === "APPROVED"
          ? CheckCircle
          : request.status === "REJECTED"
            ? XCircle
            : Clock,
      status: request.status.toLowerCase() as any,
    })) || [];

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Please log in to view your dashboard</p>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>No staff profile found for your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your lecturer portal</p>
      </div>

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-3">
        <StatCard
          title="Assigned Courses"
          value={coursesLoading ? "..." : courses?.length || 0}
          trend={{ label: "Active", direction: "up" }}
          footerLabel="Enrolled Courses"
          footerIcon={BookOpen}
        />

        <StatCard
          title="Total Students"
          value="-"
          trend={{ label: "Stable", direction: "up" }}
          footerLabel="Student Engagement"
          footerIcon={Users}
        />

        <StatCard
          title="Pending Requests"
          value={
            requestsLoading
              ? "..."
              : requests?.filter((r) => r.status === "PENDING").length || 0
          }
          trend={{ label: "Requires Action", direction: "down" }}
          footerLabel="Result Edit Requests"
          footerIcon={FileEdit}
        />
      </div>

      <div className="rounded-xl border p-6 bg-card shadow-sm">
        <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
          Recent Activity
          <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
            Live Feed
          </span>
        </h2>
        {requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ActivityList items={activityItems.slice(0, 5)} />
        )}
      </div>
    </div>
  );
}
