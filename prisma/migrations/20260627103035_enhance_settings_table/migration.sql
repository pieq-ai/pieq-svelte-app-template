-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "configuration" JSONB,
ADD COLUMN     "name" VARCHAR(100),
ALTER COLUMN "payroll_cutoff" DROP NOT NULL;

-- Migrate existing records
UPDATE "settings"
SET "name" = 'payroll_cutoff',
    "configuration" = json_build_object('payroll_cut_off_date', COALESCE("payroll_cutoff", 25))
WHERE "name" IS NULL;

-- Seed default record if settings table is empty
INSERT INTO "settings" ("cuid", "payroll_cutoff", "name", "configuration", "updated_at")
SELECT 'cjld2cyuq0000tztz54877777', 25, 'payroll_cutoff', '{"payroll_cut_off_date": 25}'::jsonb, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "settings");

