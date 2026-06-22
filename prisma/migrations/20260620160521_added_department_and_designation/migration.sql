-- CreateTable
CREATE TABLE "departments" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_cuid_key" ON "departments"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designations_cuid_key" ON "designations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designations_name_key" ON "designations"("name");
