-- AlterTable
ALTER TABLE "employment_types" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "holiday_calendars" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "leave_policies" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "leave_policy_employment_types" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "leave_types" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;
