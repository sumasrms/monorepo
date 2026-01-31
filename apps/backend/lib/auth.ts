import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';
import { admin, bearer, openAPI, twoFactor } from 'better-auth/plugins';
import { resend } from './email/resend';
import { ac, roles } from './permissions';
import { createAuthMiddleware, APIError } from 'better-auth/api';

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

export const auth = betterAuth({
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
        console.log(res, user.email);
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
        user: { role: string };
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

      await Promise.resolve();
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
  ],
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
  ],
});
