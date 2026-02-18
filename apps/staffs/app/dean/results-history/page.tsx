"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import {
  useFacultyResults,
  useMyFacultyDepartments,
  useDepartmentOfferings,
} from "@/features/dean/hooks/useDeanFaculty";
import { Result } from "@/features/results/types";

export default function DeanResultsHistoryPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState("");
  const [session, setSession] = useState("");

  const { data: departments } = useMyFacultyDepartments();
  const { data: offerings } = useDepartmentOfferings(departmentId);
  const { data: results, isLoading } = useFacultyResults({
    departmentId: departmentId || undefined,
    courseId: courseId || undefined,
    semester: semester || undefined,
    session: session || undefined,
  });

  const columns = useMemo<ColumnDef<Result>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessorFn: (row) => row.createdAt,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "course",
        header: "Course",
        accessorFn: (row) => row.course?.code || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.course?.code || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.course?.title || ""}
            </div>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        accessorFn: (row) => row.course?.department?.code || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.course?.department?.name || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.course?.department?.code || ""}
            </div>
          </div>
        ),
      },
      {
        id: "student",
        header: "Student",
        accessorFn: (row) => row.student?.matricNumber || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.student?.user?.name || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.student?.matricNumber || "-"}
            </div>
          </div>
        ),
      },
      {
        id: "score",
        header: "Score",
        accessorFn: (row) => row.score,
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold">
            {Number(getValue()).toFixed(1)}
          </span>
        ),
      },
      {
        id: "grade",
        header: "Grade",
        accessorFn: (row) => row.grade,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {(getValue() as string).replace(/_/g, " ")}
          </span>
        ),
      },
      {
        id: "session",
        header: "Session",
        accessorFn: (row) => row.session,
      },
      {
        id: "semester",
        header: "Semester",
        accessorFn: (row) => row.semester,
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
        <h1 className="text-3xl font-bold">Faculty Results History</h1>
        <p className="text-muted-foreground">
          Review results across departments and semesters
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setCourseId("");
            }}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All departments</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All courses</option>
            {offerings?.map((offering) => (
              <option key={offering.course.id} value={offering.course.id}>
                {offering.course.code} - {offering.course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All semesters</option>
            <option value="FIRST">First</option>
            <option value="SECOND">Second</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Session
          </label>
          <input
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="e.g. 2023/2024"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={results || []}
        searchPlaceholder="Search results..."
        emptyMessage="No results found for the selected filters."
      />
    </div>
  );
}
