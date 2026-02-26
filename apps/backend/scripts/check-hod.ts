/**
 * One-off script: check user "lecturer-1" and department HOD linkage.
 * Run from repo root: pnpm --filter backend exec tsx scripts/check-hod.ts
 * Or from apps/backend: npx tsx scripts/check-hod.ts (requires .env with DATABASE_URL)
 */
import prisma from '../lib/prisma';

async function main() {
  const hodId = 'lecturer-1';

  console.log('1. User with id =', hodId);
  const user = await prisma.user.findUnique({
    where: { id: hodId },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log(user ? JSON.stringify(user, null, 2) : '  -> NOT FOUND');

  console.log('\n2. Staff with userId =', hodId, 'or staff id =', hodId);
  const staffByUserId = await prisma.staff.findFirst({
    where: { userId: hodId },
    select: { id: true, staffNumber: true, userId: true, departmentId: true, user: { select: { id: true, name: true } } },
  });
  const staffById = await prisma.staff.findUnique({
    where: { id: hodId },
    select: { id: true, staffNumber: true, userId: true, departmentId: true, user: { select: { id: true, name: true } } },
  });
  console.log('  By userId:', staffByUserId ? JSON.stringify(staffByUserId, null, 2) : '  NOT FOUND');
  console.log('  By staff id:', staffById ? JSON.stringify(staffById, null, 2) : '  NOT FOUND');

  console.log('\n3. Department with hodId =', hodId);
  const dept = await prisma.department.findFirst({
    where: { hodId },
    select: { id: true, name: true, code: true, hodId: true },
  });
  console.log(dept ? JSON.stringify(dept, null, 2) : '  NONE');

  console.log('\n4. All users with role = hod');
  const hodUsers = await prisma.user.findMany({
    where: { role: 'hod' },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log(hodUsers.length ? hodUsers : '  NONE');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
