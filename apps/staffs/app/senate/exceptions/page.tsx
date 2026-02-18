"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Clock, ShieldAlert } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { useResultAuditsForSenate } from "@/features/results/hooks/useResults";
import { ResultAudit } from "@/features/results/types";

const EXCEPTION_MATCH = /(REJECTED|FLAGGED|VIOLATION|EXCEPTION)/i;

export default function SenateExceptionsPage() {
  const { data: audits, isLoading } = useResultAuditsForSenate();
  const [actionFilter, setActionFilter] = useState("");

  const exceptionAudits = useMemo(() => {
    if (!audits) return [];
    return audits.filter((audit) => EXCEPTION_MATCH.test(audit.action || ""));
  }, [audits]);

  const filteredAudits = useMemo(() => {
    if (!actionFilter) return exceptionAudits;
    return exceptionAudits.filter((audit) => audit.action === actionFilter);
  }, [exceptionAudits, actionFilter]);

  const actionOptions = useMemo(() => {
    const actions = new Set<string>();
    exceptionAudits.forEach((audit) => actions.add(audit.action));
    return Array.from(actions.values()).sort();
  }, [exceptionAudits]);

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
        id: "unit",
        header: "Department",
        accessorFn: (row) => row.result?.course?.department?.name || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold">
              {row.original.result?.course?.department?.name || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.result?.course?.department?.faculty?.name || ""}
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exception Management</h1>
          <p className="text-muted-foreground">
            Monitor rejected results and policy exceptions across the university
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold text-muted-foreground">
          <ShieldAlert className="h-4 w-4" />
          {exceptionAudits.length} Active Exceptions
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">
          Filter by action
        </label>
        <select
          className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
        >
          <option value="">All Exception Actions</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAudits}
        searchPlaceholder="Search exceptions by course, student, or department..."
        emptyMessage="No exception records found."
      />

      {exceptionAudits.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center bg-muted/20">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-bold text-muted-foreground">
            No exceptional cases detected in the audit log.
          </p>
        </div>
      )}
    </div>
  );
}
