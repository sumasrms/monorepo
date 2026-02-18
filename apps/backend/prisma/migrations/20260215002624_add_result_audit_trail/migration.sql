-- CreateTable
CREATE TABLE "result_audit" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "actorRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "result_audit_resultId_idx" ON "result_audit"("resultId");

-- AddForeignKey
ALTER TABLE "result_audit" ADD CONSTRAINT "result_audit_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
