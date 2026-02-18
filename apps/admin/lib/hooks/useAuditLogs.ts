import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_AUDIT_LOGS } from "@/lib/graphql/audit";

export type AuditLog = {
  id: string;
  category: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  reason?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  departmentId?: string | null;
  createdAt: string;
};

export type AuditLogFilter = {
  category?: string;
  actorId?: string;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  departmentId?: string;
  from?: string;
  to?: string;
  take?: number;
  skip?: number;
};

export function useAuditLogs(filter?: AuditLogFilter) {
  return useQuery<AuditLog[]>({
    queryKey: ["auditLogs", filter],
    queryFn: () => graphqlClient.request(GET_AUDIT_LOGS, { filter }),
    select: (data: any) => data?.auditLogs ?? [],
  });
}
