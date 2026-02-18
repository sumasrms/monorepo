"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { useResultAuditsByDepartment } from "@/features/results/hooks/useResults";
import { ResultAudit } from "@/features/results/types";

export default function HodAuditTrailPage() {
  const { data: audits, isLoading } = useResultAuditsByDepartment();

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
            {(getValue() as string).replace("_", " ")}
          </span>
        ),
      },
      {
        id: "course",
        header: "Course",
        accessorFn: (row) => row.result?.course?.code || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.result?.course?.code || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.result?.course?.title || ""}
            </div>
          </div>
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
              {row.original.result?.student?.matricNumber || ""}
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
            {(getValue() as string).replace("_", " ")}
          </span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        accessorFn: (row) => row.actorRole || "-",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string).replace("_", " ")}
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
      <div>
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <p className="text-muted-foreground">
          Review result activity across your department
        </p>
      </div>

      <DataTable
        columns={columns}
        data={audits || []}
        searchPlaceholder="Search audits..."
        emptyMessage="No audit entries found."
      />
    </div>
  );
}
