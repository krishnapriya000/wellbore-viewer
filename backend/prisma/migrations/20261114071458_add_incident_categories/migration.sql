-- CreateTable
CREATE TABLE "incident_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_types" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_families_name_key" ON "incident_families"("name");

-- CreateIndex
CREATE INDEX "incident_types_family_id_idx" ON "incident_types"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "incident_types_family_id_name_key" ON "incident_types"("family_id", "name");

-- AddForeignKey
ALTER TABLE "incident_types" ADD CONSTRAINT "incident_types_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "incident_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
