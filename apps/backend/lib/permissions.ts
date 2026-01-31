import { createAccessControl } from 'better-auth/plugins/access';

export const roles = {
  ADMIN: 'admin',
  STUDENT: 'student',
  LECTURER: 'lecturer',
  HOD: 'hod',
  DEAN: 'dean',
  SENATE: 'senate',
  REGISTRY: 'registry',
  EXAMS: 'exams',
} as const;

export const ac = createAccessControl({
  roles: [
    roles.ADMIN,
    roles.STUDENT,
    roles.LECTURER,
    roles.HOD,
    roles.DEAN,
    roles.SENATE,
    roles.REGISTRY,
    roles.EXAMS,
  ],
  defaultRoles: [roles.STUDENT],
  //   defaultRole: roles.STUDENT,
});
