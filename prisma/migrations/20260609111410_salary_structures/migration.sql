-- CreateTable
CREATE TABLE "salary_structures" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structure_items" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "salary_structure_cuid" TEXT NOT NULL,
    "salary_component_cuid" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "salary_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_cuid_key" ON "salary_structures"("cuid");

-- CreateIndex
CREATE INDEX "salary_structures_employee_cuid_idx" ON "salary_structures"("employee_cuid");

-- CreateIndex
CREATE INDEX "salary_structures_cuid_idx" ON "salary_structures"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_items_cuid_key" ON "salary_structure_items"("cuid");

-- CreateIndex
CREATE INDEX "salary_structure_items_salary_structure_cuid_idx" ON "salary_structure_items"("salary_structure_cuid");

-- CreateIndex
CREATE INDEX "salary_structure_items_cuid_idx" ON "salary_structure_items"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_items_salary_structure_cuid_salary_compone_key" ON "salary_structure_items"("salary_structure_cuid", "salary_component_cuid");
