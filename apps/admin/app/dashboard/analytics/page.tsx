"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { useAuditLogs, AuditLog } from "@/lib/hooks/useAuditLogs";

export default function AuditAnalyticsPage() {
  const { data: audits, isLoading } = useAuditLogs({ take: 200 });

  const columns = useMemo<ColumnDef<AuditLog>[]>(
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
        id: "category",
        header: "Category",
        accessorFn: (row) => row.category,
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string).toUpperCase()}
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
        id: "actor",
        header: "Actor",
        accessorFn: (row) => row.actorRole || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-xs font-semibold">
              {(row.original.actorRole || "-").toString().toUpperCase()}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.actorId || "-"}
            </div>
          </div>
        ),
      },
      {
        id: "entity",
        header: "Entity",
        accessorFn: (row) => row.entityType || "-",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-xs font-semibold">
              {row.original.entityType || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.entityId || "-"}
            </div>
          </div>
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
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Audit Reports</h1>
          <p className="text-muted-foreground">
            Organization-wide audit log for system accountability
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={audits || []} searchKey="action" />
    </div>
  );
}
