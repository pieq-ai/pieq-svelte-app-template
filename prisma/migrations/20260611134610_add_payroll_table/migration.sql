-- CreateTable
CREATE TABLE "payroll" (
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
    "payroll_breakdown" JSONB NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_cuid_key" ON "payroll"("cuid");

-- CreateIndex
CREATE INDEX "payroll_employee_cuid_idx" ON "payroll"("employee_cuid");

-- CreateIndex
CREATE INDEX "payroll_year_month_idx" ON "payroll"("year", "month");

-- CreateIndex
CREATE INDEX "payroll_cuid_idx" ON "payroll"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_employee_cuid_month_year_key" ON "payroll"("employee_cuid", "month", "year");
