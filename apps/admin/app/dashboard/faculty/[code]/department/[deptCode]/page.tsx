"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_DEPARTMENT_BY_CODE,
  REMOVE_DEPARTMENT,
} from "@/lib/graphql/department";
import { Button } from "@workspace/ui/components/button";
import {
  Users,
  GraduationCap,
  BookOpen,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  ChevronRight,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { cn } from "@workspace/ui/lib/utils";

export default function DepartmentDetailPage() {
  const { code, deptCode } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"courses" | "students">("courses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["department", deptCode],
    queryFn: () =>
      graphqlClient.request<any>(GET_DEPARTMENT_BY_CODE, { code: deptCode }),
    enabled: !!deptCode,
  });

  const department = data?.departmentByCode;

  const removeDeptMutation = useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(REMOVE_DEPARTMENT, { id }),
    onSuccess: () => {
      router.push(`/dashboard/faculty/${code}`);
      queryClient.invalidateQueries({ queryKey: ["faculty", code] });
    },
  });

  if (isLoading)
    return <div className="p-8">Loading department details...</div>;
  if (!department)
    return <div className="p-8 text-center">Department not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/faculty/${code}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {department.faculty?.name}
          </Link>
          <ChevronRight size={16} className="text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            {department.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <UserCheck size={16} />
            Assign HOD
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus size={16} />
            Add Course
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => {
              if (confirm("Are you sure?")) {
                removeDeptMutation.mutate(department.id);
              }
            }}
          >
            <Trash2 size={16} />
            Delete Dept
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={department.stats?.studentCount || 0}
          icon={GraduationCap}
          badgeText="Students"
          badgeVariant="default"
        />
        <StatCard
          title="Total Courses"
          value={department.stats?.courseCount || 0}
          icon={BookOpen}
          badgeText="Courses"
          badgeVariant="secondary"
        />
        <StatCard
          title="Total Staffs"
          value={department.stats?.staffCount || 0}
          icon={Users}
          badgeText="Staffs"
          badgeVariant="outline"
        />
        <StatCard
          title="Years of Study"
          value={department.numberOfYears}
          icon={FileSpreadsheet}
          badgeText="Academic"
          badgeVariant="success"
        />
      </div>

      {/* Course/Students Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white dark:bg-neutral-900 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab("courses")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === "courses"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === "students"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              Students
            </button>
          </div>

          <div className="flex items-center border rounded-lg p-1 bg-white dark:bg-neutral-900 shadow-sm w-fit">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-2xl text-muted-foreground">
          {activeTab === "courses" ? (
            <div className="text-center space-y-2">
              <BookOpen size={48} className="mx-auto opacity-20" />
              <p>Course list for {department.name} will appear here.</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Users size={48} className="mx-auto opacity-20" />
              <p>Student enrollment for {department.name} will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
