-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "payroll_cutoff" DROP DEFAULT,
ALTER COLUMN "configuration" DROP DEFAULT;

-- Insert initial settings record
INSERT INTO "settings" ("cuid", "name", "payroll_cutoff", "configuration", "updated_at")
VALUES ('init_payroll_cutoff', 'payroll_cutoff', 25, '{"payroll_cut_off_date": 25}'::jsonb, NOW())
ON CONFLICT ("cuid") DO NOTHING;
