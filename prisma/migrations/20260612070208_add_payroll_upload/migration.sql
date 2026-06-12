-- AlterTable
ALTER TABLE "payroll" ADD COLUMN     "payroll_upload_cuid" TEXT;

-- CreateTable
CREATE TABLE "payroll_uploads" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'processed',
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "payroll_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_uploads_cuid_key" ON "payroll_uploads"("cuid");

-- CreateIndex
CREATE INDEX "payroll_uploads_cuid_idx" ON "payroll_uploads"("cuid");

-- CreateIndex
CREATE INDEX "payroll_uploads_year_month_idx" ON "payroll_uploads"("year", "month");

-- CreateIndex
CREATE INDEX "payroll_payroll_upload_cuid_idx" ON "payroll"("payroll_upload_cuid");
