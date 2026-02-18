"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, Filter } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { useAllFaculties, useSenateResultsHistory } from "@/features/senate/hooks/useSenateUniversity";
import { Result } from "@/features/results/types";

const STATUS_OPTIONS = [
  "PENDING",
  "HOD_APPROVED",
  "DEAN_APPROVED",
  "SENATE_APPROVED",
  "PUBLISHED",
  "REJECTED",
];

export default function SenateHistoryPage() {
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState("");

  const { data: faculties } = useAllFaculties();
  const {
    data: results,
    isLoading,
  } = useSenateResultsHistory({
    facultyId: facultyId || undefined,
    departmentId: departmentId || undefined,
    courseId: courseId || undefined,
    semester: semester || undefined,
    session: session || undefined,
    status: status || undefined,
  });

  const departmentOptions = useMemo(() => {
    if (!faculties) return [];
    if (!facultyId) {
      return faculties.flatMap((faculty) =>
        faculty.departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
        })),
      );
    }
    const faculty = faculties.find((f) => f.id === facultyId);
    return (
      faculty?.departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
      })) || []
    );
  }, [faculties, facultyId]);

  const courseOptions = useMemo(() => {
    if (!results) return [];
    const map = new Map<string, { id: string; code: string; title: string }>();
    results.forEach((result) => {
      const course = result.course;
      if (!map.has(course.id)) {
        map.set(course.id, { id: course.id, code: course.code, title: course.title });
      }
    });
    return Array.from(map.values());
  }, [results]);

  const columns = useMemo<ColumnDef<Result>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessorFn: (row) => row.createdAt,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(getValue() as string).toLocaleString()}
          </span>
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
        id: "course",
        header: "Course",
        accessorFn: (row) => row.course?.code || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">{row.original.course?.code || "-"}</div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.course?.title || ""}
            </div>
          </div>
        ),
      },
      {
        id: "unit",
        header: "Department",
        accessorFn: (row) => row.course?.department?.name || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.course?.department?.name || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.course?.department?.faculty?.name || ""}
            </div>
          </div>
        ),
      },
      {
        id: "score",
        header: "Score",
        accessorFn: (row) => row.score,
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as number}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {(getValue() as string).replace("_", " ")}
          </span>
        ),
      },
      {
        id: "remarks",
        header: "Senate Notes",
        accessorFn: (row) => row.approval?.senateRemarks || "-",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {(getValue() as string) || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Approval Records</h1>
        <p className="text-muted-foreground">
          Historical archive of Senate approvals, rejections, and publications
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Faculty
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={facultyId}
            onChange={(event) => {
              setFacultyId(event.target.value);
              setDepartmentId("");
            }}
          >
            <option value="">All Faculties</option>
            {faculties?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Department
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Status
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Semester
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
          >
            <option value="">All</option>
            <option value="FIRST">First</option>
            <option value="SECOND">Second</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Session
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="2023/2024"
            value={session}
            onChange={(event) => setSession(event.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Course
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">All Courses</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex items-end justify-end gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold"
            onClick={() => {
              setFacultyId("");
              setDepartmentId("");
              setCourseId("");
              setSemester("");
              setSession("");
              setStatus("");
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={results || []}
        searchPlaceholder="Search approvals by student, course, or department..."
        emptyMessage="No approval records found."
      />
    </div>
  );
}
