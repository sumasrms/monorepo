import { PrismaClient } from '@prisma/client';

function main() {
  const prisma = new PrismaClient();
  const models = Object.keys(prisma).filter(
    (k) => !k.startsWith('$') && !k.startsWith('_'),
  );
  console.log('Available models:', models);
  if (models.includes('department')) {
    console.log('SUCCESS: department model found');
  } else {
    console.log('FAILURE: department model NOT found');
  }
}

main();
