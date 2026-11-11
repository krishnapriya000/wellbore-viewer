-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('PLAN', 'ACTUAL');

-- CreateEnum
CREATE TYPE "LateralType" AS ENUM ('MAIN', 'BRANCH');

-- CreateTable
CREATE TABLE "Well" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wellCode" TEXT,
    "fieldName" TEXT,
    "location" TEXT,
    "description" TEXT,
    "datumElevation" DOUBLE PRECISION,
    "kbElevation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Well_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lateral" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" "LateralType" NOT NULL DEFAULT 'BRANCH',
    "parentLateralId" TEXT,
    "kickoffMd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lateral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyRun" (
    "id" TEXT NOT NULL,
    "lateralId" TEXT NOT NULL,
    "type" "SurveyType" NOT NULL,
    "name" TEXT,
    "sourceFile" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyStation" (
    "id" TEXT NOT NULL,
    "surveyRunId" TEXT NOT NULL,
    "measuredDepth" DOUBLE PRECISION NOT NULL,
    "inclination" DOUBLE PRECISION NOT NULL,
    "azimuth" DOUBLE PRECISION NOT NULL,
    "northing" DOUBLE PRECISION,
    "easting" DOUBLE PRECISION,
    "tvd" DOUBLE PRECISION,
    "doglegSeverity" DOUBLE PRECISION,

    CONSTRAINT "SurveyStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationInterval" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "lateralId" TEXT,
    "name" TEXT NOT NULL,
    "topMd" DOUBLE PRECISION NOT NULL,
    "baseMd" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormationInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LithologyInterval" (
    "id" TEXT NOT NULL,
    "lateralId" TEXT NOT NULL,
    "formationId" TEXT,
    "name" TEXT NOT NULL,
    "topMd" DOUBLE PRECISION NOT NULL,
    "baseMd" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LithologyInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringEvent" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "lateralId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT,
    "measuredDepth" DOUBLE PRECISION,
    "eventDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineeringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellConstructionSection" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "topMd" DOUBLE PRECISION NOT NULL,
    "baseMd" DOUBLE PRECISION NOT NULL,
    "holeSize" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellConstructionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasingString" (
    "id" TEXT NOT NULL,
    "wellId" TEXT NOT NULL,
    "casingName" TEXT NOT NULL,
    "topMd" DOUBLE PRECISION NOT NULL,
    "shoeMd" DOUBLE PRECISION NOT NULL,
    "outerDiameter" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasingString_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Well_wellCode_key" ON "Well"("wellCode");

-- CreateIndex
CREATE INDEX "Lateral_wellId_idx" ON "Lateral"("wellId");

-- CreateIndex
CREATE UNIQUE INDEX "Lateral_wellId_code_key" ON "Lateral"("wellId", "code");

-- CreateIndex
CREATE INDEX "SurveyRun_lateralId_type_idx" ON "SurveyRun"("lateralId", "type");

-- CreateIndex
CREATE INDEX "SurveyStation_surveyRunId_idx" ON "SurveyStation"("surveyRunId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyStation_surveyRunId_measuredDepth_key" ON "SurveyStation"("surveyRunId", "measuredDepth");

-- CreateIndex
CREATE INDEX "FormationInterval_wellId_lateralId_idx" ON "FormationInterval"("wellId", "lateralId");

-- CreateIndex
CREATE INDEX "LithologyInterval_lateralId_idx" ON "LithologyInterval"("lateralId");

-- CreateIndex
CREATE INDEX "EngineeringEvent_wellId_lateralId_idx" ON "EngineeringEvent"("wellId", "lateralId");

-- CreateIndex
CREATE INDEX "WellConstructionSection_wellId_idx" ON "WellConstructionSection"("wellId");

-- CreateIndex
CREATE INDEX "CasingString_wellId_idx" ON "CasingString"("wellId");

-- AddForeignKey
ALTER TABLE "Lateral" ADD CONSTRAINT "Lateral_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lateral" ADD CONSTRAINT "Lateral_parentLateralId_fkey" FOREIGN KEY ("parentLateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyRun" ADD CONSTRAINT "SurveyRun_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyStation" ADD CONSTRAINT "SurveyStation_surveyRunId_fkey" FOREIGN KEY ("surveyRunId") REFERENCES "SurveyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationInterval" ADD CONSTRAINT "FormationInterval_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationInterval" ADD CONSTRAINT "FormationInterval_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LithologyInterval" ADD CONSTRAINT "LithologyInterval_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LithologyInterval" ADD CONSTRAINT "LithologyInterval_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "FormationInterval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringEvent" ADD CONSTRAINT "EngineeringEvent_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringEvent" ADD CONSTRAINT "EngineeringEvent_lateralId_fkey" FOREIGN KEY ("lateralId") REFERENCES "Lateral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellConstructionSection" ADD CONSTRAINT "WellConstructionSection_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasingString" ADD CONSTRAINT "CasingString_wellId_fkey" FOREIGN KEY ("wellId") REFERENCES "Well"("id") ON DELETE CASCADE ON UPDATE CASCADE;
