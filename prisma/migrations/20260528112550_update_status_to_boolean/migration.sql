/*
  Warnings:

  - The `status` column on the `attendance_source` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `department` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `designation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `document_type` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `employment_type` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `languages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `leave_policy` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `leave_type` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `nationality` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `pay_grade` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `permissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `relation_type` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `salary_component` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `salary_structure` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `skills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `system_roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "attendance_source" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "department" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "designation" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "document_type" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "employment_type" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "languages" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "leave_policy" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "leave_type" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "nationality" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "pay_grade" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "relation_type" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "role" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_component" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_structure" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "shift" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "system_roles" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "MasterStatusEnum";
