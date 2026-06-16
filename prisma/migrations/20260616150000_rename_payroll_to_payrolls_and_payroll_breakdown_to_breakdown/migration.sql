-- Rename Table
ALTER TABLE "payroll" RENAME TO "payrolls";

-- Rename Column
ALTER TABLE "payrolls" RENAME COLUMN "payroll_breakdown" TO "breakdown";

-- Rename Constraints & Indexes
ALTER TABLE "payrolls" RENAME CONSTRAINT "payroll_pkey" TO "payrolls_pkey";
ALTER INDEX "payroll_cuid_key" RENAME TO "payrolls_cuid_key";
ALTER INDEX "payroll_employee_cuid_month_year_key" RENAME TO "payrolls_employee_cuid_month_year_key";
ALTER INDEX "payroll_employee_cuid_idx" RENAME TO "payrolls_employee_cuid_idx";
ALTER INDEX "payroll_year_month_idx" RENAME TO "payrolls_year_month_idx";
ALTER INDEX "payroll_cuid_idx" RENAME TO "payrolls_cuid_idx";
ALTER INDEX "payroll_payroll_upload_cuid_idx" RENAME TO "payrolls_payroll_upload_cuid_idx";
