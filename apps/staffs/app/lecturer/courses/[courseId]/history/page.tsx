"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Clock } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { useResultAuditsByCourse } from "@/features/results/hooks/useResults";
import { ResultAudit } from "@/features/results/types";
import Link from "next/link";

export default function LecturerUploadHistoryPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { data: audits, isLoading } = useResultAuditsByCourse(courseId);

  const columns = useMemo<ColumnDef<ResultAudit>[]>(
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
        id: "action",
        header: "Action",
        accessorFn: (row) => row.action,
        cell: ({ getValue }) => (
          <span className="font-semibold">
            {(getValue() as string).replace(/_/g, " ")}
          </span>
        ),
      },
      {
        id: "student",
        header: "Student",
        accessorFn: (row) => row.result?.student?.matricNumber || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.result?.student?.user?.name || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.result?.student?.matricNumber || "-"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.result?.status || "-",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {(getValue() as string).replace(/_/g, " ")}
          </span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        accessorFn: (row) => row.actorRole || "-",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string).toUpperCase()}
          </span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        accessorFn: (row) => row.reason || "-",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload History</h1>
          <p className="text-muted-foreground">
            Full timeline of submissions and approvals
          </p>
        </div>
        <Link
          href={`/lecturer/courses/${courseId}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Back to course
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={audits || []}
        searchKey="action"
      />
    </div>
  );
}
