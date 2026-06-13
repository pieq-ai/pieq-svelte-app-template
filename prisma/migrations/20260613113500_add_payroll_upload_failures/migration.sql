-- AlterTable
ALTER TABLE "payroll_uploads" ADD COLUMN     "failure_reason" TEXT;

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
CREATE UNIQUE INDEX "payroll_upload_failures_cuid_key" ON "payroll_upload_failures"("cuid");

-- CreateIndex
CREATE INDEX "payroll_upload_failures_payroll_upload_cuid_idx" ON "payroll_upload_failures"("payroll_upload_cuid");

-- CreateIndex
CREATE INDEX "payroll_upload_failures_cuid_idx" ON "payroll_upload_failures"("cuid");
