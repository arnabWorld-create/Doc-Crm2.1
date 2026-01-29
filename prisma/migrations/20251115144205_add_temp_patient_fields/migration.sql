-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "tempPatientContact" TEXT,
ADD COLUMN     "tempPatientName" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL;
