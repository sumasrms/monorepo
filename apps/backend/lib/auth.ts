import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';
import {
  admin,
  bearer,
  openAPI,
  twoFactor,
  customSession,
} from 'better-auth/plugins';
import { resend } from './email/resend';
import { ac, roles } from './permissions';
import type { UserWithRole } from './auth.types';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { AuditCategory } from '@prisma/client';

const from = process.env.BETTER_AUTH_EMAIL || 'delivered@resend.dev';
const to = process.env.TEST_EMAIL || '';

const PORTAL_ROLES = {
  student: [roles.STUDENT],
  staff: [
    roles.LECTURER,
    roles.HOD,
    roles.DEAN,
    roles.SENATE,
    roles.REGISTRY,
    roles.EXAMS,
  ],
  admin: [roles.ADMIN],
} as const;

async function logAuthEvent(ctx: any, action: string) {
  try {
    const returned = (ctx as any).returned as
      | { user?: { id?: string; role?: string } }
      | undefined;

    const user = returned?.user;
    if (!user?.id) {
      return;
    }

    const ipAddress =
      ctx?.headers?.get?.('x-forwarded-for')?.split(',')?.[0]?.trim() || null;
    const userAgent = ctx?.headers?.get?.('user-agent') || null;

    await prisma.auditLog.create({
      data: {
        category: AuditCategory.AUTH,
        action,
        actorId: user.id,
        actorRole: user.role || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    return;
  }
}

export const auth: any = betterAuth({
  appName: 'Sumas Backend',
  baseURL: process.env.BETTER_AUTH_BASE_URL || 'http://localhost:4000',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await resend.emails.send({
        from,
        to: user.email,
        subject: 'Reset your password',
        html: `Click <a href="${url}">here</a> to reset your password.`,
      });
    },
    emailVerification: {
      async sendVerificationEmail({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) {
        const res = await resend.emails.send({
          from,
          to: to || user.email,
          subject: 'Verify your email address',
          html: `<a href="${url}">Verify your email address</a>`,
        });
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') {
        return;
      }

      const portalType = ctx.headers?.get('x-portal-type') as
        | 'student'
        | 'staff'
        | 'admin'
        | null;

      if (!portalType) {
        throw new APIError('FORBIDDEN', {
          message: `Access denied. You are not authorized to access this portal.`,
        });
      }

      const email = (ctx.body as { email?: string })?.email;
      if (!email) {
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });

      if (!user || !user.role) {
        return;
      }

      const allowedRoles = PORTAL_ROLES[portalType];
      const isRoleAllowed = allowedRoles.some((role) => role === user.role);

      if (!isRoleAllowed) {
        throw new APIError('FORBIDDEN', {
          message: `Access denied. You are not authorized to access this portal.`,
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email' || ctx.path === '/sign-in') {
        await logAuthEvent(ctx, 'LOGIN');
      }

      if (ctx.path === '/sign-out' || ctx.path === '/sign-out/all') {
        await logAuthEvent(ctx, 'LOGOUT');
      }

      if (ctx.path !== '/get-session') {
        return;
      }

      const portalType = ctx.headers?.get('x-portal-type') as
        | 'student'
        | 'staff'
        | 'admin'
        | null;

      if (!portalType) {
        return;
      }

      const sessionData = (ctx as any).returned as {
        session: any;
        user: { id: string; role: string };
      } | null;

      if (!sessionData || !sessionData.user) {
        return;
      }

      const userRole = sessionData.user.role;
      const allowedRoles = PORTAL_ROLES[portalType] as readonly string[];

      if (!allowedRoles.includes(userRole)) {
        return {
          response: {
            session: null,
            user: null,
          } as any,
        };
      }
    }),
  },
  plugins: [
    openAPI(),
    admin({
      /* cspell:disable-next-line */
      adminUserIds: ['EXD5zjob2SD6CBWcEQ6OpLRHcyoUbnaB'],
      ac,
      defaultRole: roles.STUDENT,
    }),
    twoFactor(),
    passkey(),
    bearer(),
    customSession(async ({ user, session }) => {
      // Fetch the user with role from the database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          facultyId: true,
        },
      });

      const userWithRole = {
        ...user,
        ...(dbUser || {}),
      } as UserWithRole;

      // Add staffProfile for staff users
      if (
        userWithRole.role &&
        PORTAL_ROLES.staff.some((role) => role === userWithRole.role)
      ) {
        const staffProfile = await prisma.staff.findUnique({
          where: { userId: userWithRole.id },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                facultyId: true,
              },
            },
          },
        });

        if (staffProfile) {
          let resolvedFacultyId =
            userWithRole.facultyId || staffProfile.department?.facultyId;

          if (!resolvedFacultyId) {
            const faculty = await prisma.faculty.findFirst({
              where: { deanId: userWithRole.id },
              select: { id: true },
            });
            resolvedFacultyId = faculty?.id || undefined;
          }

          if (resolvedFacultyId && !userWithRole.facultyId) {
            await prisma.user.update({
              where: { id: userWithRole.id },
              data: { facultyId: resolvedFacultyId },
            });
          }

          return {
            user: {
              ...userWithRole,
              staffProfile: {
                id: staffProfile.id,
                staffNumber: staffProfile.staffNumber,
                institutionalRank: staffProfile.institutionalRank,
                designation: staffProfile.designation,
                dateOfBirth: staffProfile.dateOfBirth,
                employmentDate: staffProfile.employmentDate,
                employmentType: staffProfile.employmentType,
                departmentId: staffProfile.departmentId,
                qualifications: staffProfile.qualifications,
                specialization: staffProfile.specialization,
                department: staffProfile.department,
                facultyId: resolvedFacultyId,
              },
            },
            session,
          };
        }
      }

      // Add studentProfile for student users
      if (userWithRole.role === roles.STUDENT) {
        const studentProfile = await prisma.student.findUnique({
          where: { userId: userWithRole.id },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

        if (studentProfile) {
          return {
            user: {
              ...userWithRole,
              studentProfile: {
                id: studentProfile.id,
                matricNumber: studentProfile.matricNumber,
                level: studentProfile.level,
                departmentId: studentProfile.departmentId,
                department: studentProfile.department,
              },
            },
            session,
          };
        }
      }

      return { user: userWithRole, session };
    }),
  ],
  // advanced: {
  //   crossSubDomainCookies: {
  //     enabled: true,
  //     domain: 'localhost', // Must include the domain
  //   },
  //   defaultCookieAttributes: {
  //     sameSite: 'none',
  //     secure: false,
  //     partitioned: true, // New browser standards will mandate this for foreign cookies
  //   },
  // },
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
    'https://sumas-admin.vercel.app',
    'https://sumas-staffs.vercel.app',
    'https://sumas-students.vercel.app',
    'https://sumas-2z59.onrender.com',
  ],
});
