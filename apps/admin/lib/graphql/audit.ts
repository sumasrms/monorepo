import { gql } from "graphql-request";

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditLogFilterInput) {
    auditLogs(filter: $filter) {
      id
      category
      action
      entityType
      entityId
      actorId
      actorRole
      reason
      metadata
      ipAddress
      userAgent
      departmentId
      createdAt
    }
  }
`;
