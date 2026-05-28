/*
  Warnings:

  - You are about to drop the column `status` on the `attendance_source` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `department` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `designation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `document_type` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `languages` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `leave_policy` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `leave_type` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `nationality` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `pay_grade` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `relation_type` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `salary_component` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `salary_structure` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `shift` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `system_roles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance_source" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "audit_log" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "department" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "designation" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "document_type" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "employee_documents" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "employment" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "employment_type" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "languages" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "leave_policy" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "leave_request" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "leave_type" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "nationality" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pay_grade" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "payroll" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "relation_type" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "role" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_component" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_structure" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "shift" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "system_roles" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_account" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_session" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- DropEnum
DROP TYPE "MasterStatusEnum";
