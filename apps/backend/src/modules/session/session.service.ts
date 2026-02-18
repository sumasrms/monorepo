import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSessionInput, UpdateSessionInput } from './dto/session.input';
import { Semester } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(input: CreateSessionInput) {
    return this.prisma.academicSession.create({
      data: input,
    });
  }

  async getAllSessions() {
    return this.prisma.academicSession.findMany({
      orderBy: { session: 'desc' },
    });
  }

  async getSessionById(id: string) {
    return this.prisma.academicSession.findUnique({
      where: { id },
    });
  }

  async updateSession(input: UpdateSessionInput) {
    const { id, ...data } = input;
    return this.prisma.academicSession.update({
      where: { id },
      data,
    });
  }

  async activateSession(sessionId: string, semester: Semester) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Set all sessions to not current
      await tx.academicSession.updateMany({
        data: { isCurrent: false },
      });

      // 2. Set target session to current
      const session = await tx.academicSession.update({
        where: { id: sessionId },
        data: { isCurrent: true, isActive: true },
      });

      // 3. Update global settings
      await tx.settings.upsert({
        where: { key: 'academic_settings' },
        update: {
          currentSessionId: sessionId,
          currentSemester: semester,
        },
        create: {
          key: 'academic_settings',
          currentSessionId: sessionId,
          currentSemester: semester,
        },
      });

      return session;
    });
  }

  async getCurrentSession() {
    return this.prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
  }

  async getAcademicSettings() {
    return this.prisma.settings.findUnique({
      where: { key: 'academic_settings' },
      include: { currentSession: true },
    });
  }
}
