-- DropForeignKey
ALTER TABLE "LithologyInterval" DROP CONSTRAINT "LithologyInterval_formationId_fkey";

-- DropForeignKey
ALTER TABLE "LithologyInterval" DROP CONSTRAINT "LithologyInterval_lateralId_fkey";

-- AlterTable
ALTER TABLE "CasingString" ADD COLUMN     "description" TEXT,
ADD COLUMN     "lateralId" TEXT;

-- AlterTable
ALTER TABLE "FormationInterval" ADD COLUMN     "ref" TEXT NOT NULL DEFAULT 'TVD';

-- AlterTable
ALTER TABLE "LithologyInterval" ALTER COLUMN "lateralId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WellConstructionSection" ADD COLUMN     "lateralId" TEXT;

-- CreateTable
CREATE TABLE "CementInterval" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "lateralId" TEXT,
    "name" TEXT NOT NULL,
    "topMd" DOUBLE PRECISION NOT NULL,
    "baseMd" DOUBLE PRECISION NOT NULL,
    "casingSize" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CementInterval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CementInterval_wellId_idx" ON "CementInterval"("wellId");

-- CreateIndex
CREATE INDEX "LithologyInterval_formationId_idx" ON "LithologyInterval"("formationId");

-- AddForeignKey
ALTER TABLE "LithologyInterval" ADD CONSTRAINT "LithologyInterval_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LithologyInterval" ADD CONSTRAINT "LithologyInterval_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "FormationInterval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellConstructionSection" ADD CONSTRAINT "WellConstructionSection_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasingString" ADD CONSTRAINT "CasingString_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CementInterval" ADD CONSTRAINT "CementInterval_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CementInterval" ADD CONSTRAINT "CementInterval_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
