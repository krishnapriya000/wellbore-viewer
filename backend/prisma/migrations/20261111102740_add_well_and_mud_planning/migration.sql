-- CreateTable
CREATE TABLE "WellPlan" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "targetDepthMD" DOUBLE PRECISION NOT NULL,
    "targetDepthTVD" DOUBLE PRECISION NOT NULL,
    "targetInclination" DOUBLE PRECISION NOT NULL,
    "targetAzimuth" DOUBLE PRECISION NOT NULL,
    "plannedKickoffDepth" DOUBLE PRECISION NOT NULL,
    "targetObjective" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MudPlan" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "mudType" TEXT NOT NULL,
    "mudWeight" DOUBLE PRECISION NOT NULL,
    "plasticViscosity" DOUBLE PRECISION NOT NULL,
    "yieldPoint" DOUBLE PRECISION NOT NULL,
    "fluidLoss" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MudPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WellPlan_wellId_idx" ON "WellPlan"("wellId");

-- CreateIndex
CREATE INDEX "MudPlan_wellId_idx" ON "MudPlan"("wellId");

-- AddForeignKey
ALTER TABLE "WellPlan" ADD CONSTRAINT "WellPlan_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MudPlan" ADD CONSTRAINT "MudPlan_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;
