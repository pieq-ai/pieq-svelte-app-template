-- AlterTable
ALTER TABLE "company_locations" ADD COLUMN     "created_by" VARCHAR(255),
ADD COLUMN     "updated_by" VARCHAR(255);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "created_by" VARCHAR(255),
ADD COLUMN     "updated_by" VARCHAR(255);

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "created_by" VARCHAR(255),
ADD COLUMN     "updated_by" VARCHAR(255);
