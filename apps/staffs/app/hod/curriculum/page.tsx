"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { useMyDepartmentalCourses } from "@/features/hod/hooks/useHodCourses";
import { DepartmentCourse } from "@/features/hod/hooks/useHodCourses";

export default function HodCurriculumPage() {
  const { data: offerings, isLoading } = useMyDepartmentalCourses();

  const columns = useMemo<ColumnDef<DepartmentCourse>[]>(
    () => [
      {
        id: "code",
        header: "Course Code",
        accessorFn: (row) => row.course?.code || "-",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as string}</span>
        ),
      },
      {
        id: "title",
        header: "Title",
        accessorFn: (row) => row.course?.title || "-",
      },
      {
        id: "level",
        header: "Level",
        accessorFn: (row) => row.level ?? "-",
      },
      {
        id: "semester",
        header: "Semester",
        accessorFn: (row) => row.semester || "-",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string).toString().toLowerCase()}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        accessorFn: (row) => row.courseType || "-",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string).toString().toLowerCase()}
          </span>
        ),
      },
      {
        id: "credits",
        header: "Credits",
        accessorFn: (row) => row.course?.credits ?? "-",
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Department Curriculum</h1>
        <p className="text-muted-foreground">
          Read-only view of departmental course offerings
        </p>
      </div>

      <DataTable
        columns={columns}
        data={offerings || []}
        searchPlaceholder="Search courses..."
        emptyMessage="No curriculum entries found."
      />
    </div>
  );
}
