-- AlterTable
ALTER TABLE "settings" DROP COLUMN "payroll_cutoff";

-- Update CUID from 'init_payroll_cutoff' to a valid CUID
UPDATE "settings" SET "cuid" = 'hac80yivj85ubdny4zkjpd0a' WHERE "cuid" = 'init_payroll_cutoff';
