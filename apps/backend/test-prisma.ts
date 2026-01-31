import prisma from './lib/prisma';

async function main() {
  try {
    console.log('Testing prisma connection...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    const firstUser = await prisma.user.findFirst();
    console.log('First user:', firstUser);
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
