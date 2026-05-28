-- AlterTable (Rename column)
ALTER TABLE "roles" RENAME COLUMN "is_active" TO "status";

-- AlterTable (Convert Shift status from enum to Boolean)
ALTER TABLE "shift" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "shift" ALTER COLUMN "status" TYPE BOOLEAN USING (status::text = 'active');
ALTER TABLE "shift" ALTER COLUMN "status" SET DEFAULT true;
