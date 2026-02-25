-- AlterTable
ALTER TABLE "student" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT NOT NULL DEFAULT 'Nigeria',
ADD COLUMN     "stateOfOrigin" TEXT;
