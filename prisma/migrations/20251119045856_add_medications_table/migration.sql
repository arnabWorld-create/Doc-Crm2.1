-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "medicine" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "timing" TEXT,
    "duration" TEXT,
    "startFrom" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medications_visitId_idx" ON "medications"("visitId");

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
