-- CreateTable
CREATE TABLE "salary_components" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" BOOLEAN NOT NULL DEFAULT true,
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
    "component_name_snapshot" VARCHAR(150) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "salary_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_uploads" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'processed',
    "file_name" VARCHAR(255),
    "failure_reason" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "payroll_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "employee_name" VARCHAR(200) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "gross_earnings" DECIMAL(15,2) NOT NULL,
    "total_deduction" DECIMAL(15,2) NOT NULL,
    "net_salary" DECIMAL(15,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "payroll_upload_cuid" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_upload_failures" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "payroll_upload_cuid" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "employee_code" VARCHAR(50),
    "error_type" VARCHAR(100) NOT NULL,
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_upload_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_cuid_key" ON "salary_components"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_name_key" ON "salary_components"("name");

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

-- CreateIndex
CREATE UNIQUE INDEX "payroll_uploads_cuid_key" ON "payroll_uploads"("cuid");

-- CreateIndex
CREATE INDEX "payroll_uploads_cuid_idx" ON "payroll_uploads"("cuid");

-- CreateIndex
CREATE INDEX "payroll_uploads_year_month_idx" ON "payroll_uploads"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_cuid_key" ON "payrolls"("cuid");

-- CreateIndex
CREATE INDEX "payrolls_employee_cuid_idx" ON "payrolls"("employee_cuid");

-- CreateIndex
CREATE INDEX "payrolls_year_month_idx" ON "payrolls"("year", "month");

-- CreateIndex
CREATE INDEX "payrolls_payroll_upload_cuid_idx" ON "payrolls"("payroll_upload_cuid");

-- CreateIndex
CREATE INDEX "payrolls_cuid_idx" ON "payrolls"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_employee_cuid_month_year_key" ON "payrolls"("employee_cuid", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_upload_failures_cuid_key" ON "payroll_upload_failures"("cuid");

-- CreateIndex
CREATE INDEX "payroll_upload_failures_payroll_upload_cuid_idx" ON "payroll_upload_failures"("payroll_upload_cuid");

-- CreateIndex
CREATE INDEX "payroll_upload_failures_cuid_idx" ON "payroll_upload_failures"("cuid");
