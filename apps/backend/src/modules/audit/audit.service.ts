import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditLogFilterInput } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(filter?: AuditLogFilterInput) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.actorId) {
      where.actorId = filter.actorId;
    }
    if (filter?.actorRole) {
      where.actorRole = filter.actorRole;
    }
    if (filter?.action) {
      where.action = filter.action;
    }
    if (filter?.entityType) {
      where.entityType = filter.entityType;
    }
    if (filter?.entityId) {
      where.entityId = filter.entityId;
    }
    if (filter?.departmentId) {
      where.departmentId = filter.departmentId;
    }
    if (filter?.from || filter?.to) {
      where.createdAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.take ?? 200,
      skip: filter?.skip ?? 0,
    });
  }
}
