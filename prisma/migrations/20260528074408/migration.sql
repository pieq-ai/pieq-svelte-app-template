/*
  Warnings:

  - You are about to drop the column `uuid` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `designation` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `employee_documents` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `employment` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `leave_request` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `payroll` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `salary_structure` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `user_account` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `user_session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuid2]` on the table `address` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `attendance_record` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `attendance_source` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `audit_log` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `bank_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `blood_group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `company_location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `country` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `designation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `document_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employee_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employee_education` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employee_language` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employee_skill` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `employment_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `experience` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `holiday_calendar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `languages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `leave_balance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `leave_policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `leave_policy_employment_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `leave_request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `leave_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `nationality` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `pay_grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `payroll_item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `relation_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `role_permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `salary_component` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `salary_structure` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `salary_structure_item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `shift` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `shift_assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `skills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `state` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `system_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `user_account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `user_session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid2]` on the table `user_settings` will be added. If there are existing duplicate values, this will fail.
  - The required column `cuid2` was added to the `address` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `attendance_record` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `attendance_source` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `audit_log` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `bank_details` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `blood_group` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `company_location` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `country` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `department` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `designation` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `document_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employee` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employee_documents` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employee_education` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employee_language` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employee_skill` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `employment_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `experience` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `holiday_calendar` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `languages` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `leave_balance` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `leave_policy` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `leave_policy_employment_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `leave_request` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `leave_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `nationality` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `notification` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `pay_grade` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `payroll` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `payroll_item` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `permissions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `relation_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `role` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `role_permission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `salary_component` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `salary_structure` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `salary_structure_item` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `shift` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `shift_assignment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `skills` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `state` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `system_roles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `user_account` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `user_session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid2` was added to the `user_settings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "audit_log_uuid_key";

-- DropIndex
DROP INDEX "designation_uuid_key";

-- DropIndex
DROP INDEX "employee_uuid_key";

-- DropIndex
DROP INDEX "employee_documents_uuid_key";

-- DropIndex
DROP INDEX "employment_uuid_key";

-- DropIndex
DROP INDEX "leave_request_uuid_key";

-- DropIndex
DROP INDEX "notification_uuid_key";

-- DropIndex
DROP INDEX "payroll_uuid_key";

-- DropIndex
DROP INDEX "salary_structure_uuid_key";

-- DropIndex
DROP INDEX "user_account_uuid_key";

-- DropIndex
DROP INDEX "user_session_uuid_key";

-- AlterTable
ALTER TABLE "address" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendance_record" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendance_source" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bank_details" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "blood_group" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "company_location" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "country" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "department" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "designation" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "document_type" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee_documents" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee_education" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee_language" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee_skill" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employment" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employment_type" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "experience" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "holiday_calendar" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_balance" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_policy" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_policy_employment_type" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_request" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_type" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "nationality" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pay_grade" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payroll" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payroll_item" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "relation_type" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "role_permission" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "salary_component" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "salary_structure" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "salary_structure_item" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shift" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shift_assignment" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "state" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "system_roles" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_account" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_session" DROP COLUMN "uuid",
ADD COLUMN     "cuid2" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "cuid2" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "address_cuid2_key" ON "address"("cuid2");

-- CreateIndex
CREATE INDEX "address_cuid2_idx" ON "address"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_record_cuid2_key" ON "attendance_record"("cuid2");

-- CreateIndex
CREATE INDEX "attendance_record_cuid2_idx" ON "attendance_record"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_source_cuid2_key" ON "attendance_source"("cuid2");

-- CreateIndex
CREATE INDEX "attendance_source_cuid2_idx" ON "attendance_source"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_cuid2_key" ON "audit_log"("cuid2");

-- CreateIndex
CREATE INDEX "audit_log_cuid2_idx" ON "audit_log"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_cuid2_key" ON "bank_details"("cuid2");

-- CreateIndex
CREATE INDEX "bank_details_cuid2_idx" ON "bank_details"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "blood_group_cuid2_key" ON "blood_group"("cuid2");

-- CreateIndex
CREATE INDEX "blood_group_cuid2_idx" ON "blood_group"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "company_location_cuid2_key" ON "company_location"("cuid2");

-- CreateIndex
CREATE INDEX "company_location_cuid2_idx" ON "company_location"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "country_cuid2_key" ON "country"("cuid2");

-- CreateIndex
CREATE INDEX "country_cuid2_idx" ON "country"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "department_cuid2_key" ON "department"("cuid2");

-- CreateIndex
CREATE INDEX "department_cuid2_idx" ON "department"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "designation_cuid2_key" ON "designation"("cuid2");

-- CreateIndex
CREATE INDEX "designation_cuid2_idx" ON "designation"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_cuid2_key" ON "document_type"("cuid2");

-- CreateIndex
CREATE INDEX "document_type_cuid2_idx" ON "document_type"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employee_cuid2_key" ON "employee"("cuid2");

-- CreateIndex
CREATE INDEX "employee_cuid2_idx" ON "employee"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employee_documents_cuid2_key" ON "employee_documents"("cuid2");

-- CreateIndex
CREATE INDEX "employee_documents_cuid2_idx" ON "employee_documents"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employee_education_cuid2_key" ON "employee_education"("cuid2");

-- CreateIndex
CREATE INDEX "employee_education_cuid2_idx" ON "employee_education"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employee_language_cuid2_key" ON "employee_language"("cuid2");

-- CreateIndex
CREATE INDEX "employee_language_cuid2_idx" ON "employee_language"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skill_cuid2_key" ON "employee_skill"("cuid2");

-- CreateIndex
CREATE INDEX "employee_skill_cuid2_idx" ON "employee_skill"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employment_cuid2_key" ON "employment"("cuid2");

-- CreateIndex
CREATE INDEX "employment_cuid2_idx" ON "employment"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "employment_type_cuid2_key" ON "employment_type"("cuid2");

-- CreateIndex
CREATE INDEX "employment_type_cuid2_idx" ON "employment_type"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "experience_cuid2_key" ON "experience"("cuid2");

-- CreateIndex
CREATE INDEX "experience_cuid2_idx" ON "experience"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendar_cuid2_key" ON "holiday_calendar"("cuid2");

-- CreateIndex
CREATE INDEX "holiday_calendar_cuid2_idx" ON "holiday_calendar"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "languages_cuid2_key" ON "languages"("cuid2");

-- CreateIndex
CREATE INDEX "languages_cuid2_idx" ON "languages"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balance_cuid2_key" ON "leave_balance"("cuid2");

-- CreateIndex
CREATE INDEX "leave_balance_cuid2_idx" ON "leave_balance"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_cuid2_key" ON "leave_policy"("cuid2");

-- CreateIndex
CREATE INDEX "leave_policy_cuid2_idx" ON "leave_policy"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_type_cuid2_key" ON "leave_policy_employment_type"("cuid2");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_cuid2_idx" ON "leave_policy_employment_type"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "leave_request_cuid2_key" ON "leave_request"("cuid2");

-- CreateIndex
CREATE INDEX "leave_request_cuid2_idx" ON "leave_request"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_cuid2_key" ON "leave_type"("cuid2");

-- CreateIndex
CREATE INDEX "leave_type_cuid2_idx" ON "leave_type"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "nationality_cuid2_key" ON "nationality"("cuid2");

-- CreateIndex
CREATE INDEX "nationality_cuid2_idx" ON "nationality"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "notification_cuid2_key" ON "notification"("cuid2");

-- CreateIndex
CREATE INDEX "notification_cuid2_idx" ON "notification"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_cuid2_key" ON "pay_grade"("cuid2");

-- CreateIndex
CREATE INDEX "pay_grade_cuid2_idx" ON "pay_grade"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_cuid2_key" ON "payroll"("cuid2");

-- CreateIndex
CREATE INDEX "payroll_cuid2_idx" ON "payroll"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_item_cuid2_key" ON "payroll_item"("cuid2");

-- CreateIndex
CREATE INDEX "payroll_item_cuid2_idx" ON "payroll_item"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_cuid2_key" ON "permissions"("cuid2");

-- CreateIndex
CREATE INDEX "permissions_cuid2_idx" ON "permissions"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "relation_type_cuid2_key" ON "relation_type"("cuid2");

-- CreateIndex
CREATE INDEX "relation_type_cuid2_idx" ON "relation_type"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "role_cuid2_key" ON "role"("cuid2");

-- CreateIndex
CREATE INDEX "role_cuid2_idx" ON "role"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_cuid2_key" ON "role_permission"("cuid2");

-- CreateIndex
CREATE INDEX "role_permission_cuid2_idx" ON "role_permission"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "salary_component_cuid2_key" ON "salary_component"("cuid2");

-- CreateIndex
CREATE INDEX "salary_component_cuid2_idx" ON "salary_component"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_cuid2_key" ON "salary_structure"("cuid2");

-- CreateIndex
CREATE INDEX "salary_structure_cuid2_idx" ON "salary_structure"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_item_cuid2_key" ON "salary_structure_item"("cuid2");

-- CreateIndex
CREATE INDEX "salary_structure_item_cuid2_idx" ON "salary_structure_item"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "shift_cuid2_key" ON "shift"("cuid2");

-- CreateIndex
CREATE INDEX "shift_cuid2_idx" ON "shift"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignment_cuid2_key" ON "shift_assignment"("cuid2");

-- CreateIndex
CREATE INDEX "shift_assignment_cuid2_idx" ON "shift_assignment"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "skills_cuid2_key" ON "skills"("cuid2");

-- CreateIndex
CREATE INDEX "skills_cuid2_idx" ON "skills"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "state_cuid2_key" ON "state"("cuid2");

-- CreateIndex
CREATE INDEX "state_cuid2_idx" ON "state"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_cuid2_key" ON "system_roles"("cuid2");

-- CreateIndex
CREATE INDEX "system_roles_cuid2_idx" ON "system_roles"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_cuid2_key" ON "user_account"("cuid2");

-- CreateIndex
CREATE INDEX "user_account_cuid2_idx" ON "user_account"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_cuid2_key" ON "user_session"("cuid2");

-- CreateIndex
CREATE INDEX "user_session_cuid2_idx" ON "user_session"("cuid2");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_cuid2_key" ON "user_settings"("cuid2");

-- CreateIndex
CREATE INDEX "user_settings_cuid2_idx" ON "user_settings"("cuid2");
