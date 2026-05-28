/*
  Warnings:

  - You are about to drop the column `leave_type_id` on the `leave_policy` table. All the data in the column will be lost.
  - You are about to drop the column `employment_type_id` on the `leave_policy_employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `policy_id` on the `leave_policy_employment_type` table. All the data in the column will be lost.
  - You are about to drop the `address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_source` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bank_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blood_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `company_location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `designation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_education` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `experience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `languages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nationality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pay_grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relation_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_component` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structure_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `state` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[leave_policy_cuid,employment_type_cuid]` on the table `leave_policy_employment_type` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leave_type_cuid` to the `leave_policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employment_type_cuid` to the `leave_policy_employment_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_policy_cuid` to the `leave_policy_employment_type` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "leave_policy_employment_type_employment_type_id_idx";

-- DropIndex
DROP INDEX "leave_policy_employment_type_policy_id_employment_type_id_key";

-- DropIndex
DROP INDEX "leave_policy_employment_type_policy_id_idx";

-- AlterTable
ALTER TABLE "employment_type" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "holiday_calendar" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "leave_policy" DROP COLUMN "leave_type_id",
ADD COLUMN     "leave_type_cuid" VARCHAR(50) NOT NULL,
ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "leave_policy_employment_type" DROP COLUMN "employment_type_id",
DROP COLUMN "policy_id",
ADD COLUMN     "employment_type_cuid" VARCHAR(50) NOT NULL,
ADD COLUMN     "leave_policy_cuid" VARCHAR(50) NOT NULL,
ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "leave_type" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "address";

-- DropTable
DROP TABLE "attendance_record";

-- DropTable
DROP TABLE "attendance_source";

-- DropTable
DROP TABLE "audit_log";

-- DropTable
DROP TABLE "bank_details";

-- DropTable
DROP TABLE "blood_group";

-- DropTable
DROP TABLE "company_location";

-- DropTable
DROP TABLE "country";

-- DropTable
DROP TABLE "department";

-- DropTable
DROP TABLE "designation";

-- DropTable
DROP TABLE "document_type";

-- DropTable
DROP TABLE "employee";

-- DropTable
DROP TABLE "employee_documents";

-- DropTable
DROP TABLE "employee_education";

-- DropTable
DROP TABLE "employee_language";

-- DropTable
DROP TABLE "employee_skill";

-- DropTable
DROP TABLE "employment";

-- DropTable
DROP TABLE "experience";

-- DropTable
DROP TABLE "languages";

-- DropTable
DROP TABLE "leave_balance";

-- DropTable
DROP TABLE "leave_request";

-- DropTable
DROP TABLE "nationality";

-- DropTable
DROP TABLE "notification";

-- DropTable
DROP TABLE "pay_grade";

-- DropTable
DROP TABLE "payroll";

-- DropTable
DROP TABLE "payroll_item";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "relation_type";

-- DropTable
DROP TABLE "role";

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "salary_component";

-- DropTable
DROP TABLE "salary_structure";

-- DropTable
DROP TABLE "salary_structure_item";

-- DropTable
DROP TABLE "shift";

-- DropTable
DROP TABLE "shift_assignment";

-- DropTable
DROP TABLE "skills";

-- DropTable
DROP TABLE "state";

-- DropTable
DROP TABLE "system_roles";

-- DropTable
DROP TABLE "user_account";

-- DropTable
DROP TABLE "user_session";

-- DropTable
DROP TABLE "user_settings";

-- DropEnum
DROP TYPE "AttendanceStatusEnum";

-- DropEnum
DROP TYPE "CalculationTypeEnum";

-- DropEnum
DROP TYPE "EducationLevelEnum";

-- DropEnum
DROP TYPE "EmploymentStatusEnum";

-- DropEnum
DROP TYPE "GenderEnum";

-- DropEnum
DROP TYPE "HalfDaySessionEnum";

-- DropEnum
DROP TYPE "LanguageProficiency";

-- DropEnum
DROP TYPE "LeaveRequestStatusEnum";

-- DropEnum
DROP TYPE "MaritalStatusEnum";

-- DropEnum
DROP TYPE "NotificationTypeEnum";

-- DropEnum
DROP TYPE "PaymentFrequencyEnum";

-- DropEnum
DROP TYPE "PayrollStatusEnum";

-- DropEnum
DROP TYPE "SalaryComponentTypeEnum";

-- DropEnum
DROP TYPE "SkillLevel";

-- DropEnum
DROP TYPE "ThemeEnum";

-- CreateIndex
CREATE INDEX "leave_policy_leave_type_cuid_idx" ON "leave_policy"("leave_type_cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_leave_policy_cuid_idx" ON "leave_policy_employment_type"("leave_policy_cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_employment_type_cuid_idx" ON "leave_policy_employment_type"("employment_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_type_leave_policy_cuid_employment_t_key" ON "leave_policy_employment_type"("leave_policy_cuid", "employment_type_cuid");
