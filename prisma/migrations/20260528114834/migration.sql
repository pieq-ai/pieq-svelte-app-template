/*
  Warnings:

  - You are about to drop the column `blood_group_id` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_name` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_no` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `nationality_id` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `relation_id` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `employee` table. All the data in the column will be lost.
  - The primary key for the `salary_component` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `component_id` on the `salary_component` table. All the data in the column will be lost.
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
  - You are about to drop the `employee_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_education` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employment_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `experience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `holiday_calendar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `languages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_policy_employment_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nationality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pay_grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relation_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
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
  - The required column `id` was added to the `salary_component` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "employee_uuid_key";

-- AlterTable
ALTER TABLE "employee" DROP COLUMN "blood_group_id",
DROP COLUMN "emergency_contact_name",
DROP COLUMN "emergency_contact_no",
DROP COLUMN "nationality_id",
DROP COLUMN "relation_id",
DROP COLUMN "uuid",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_component" DROP CONSTRAINT "salary_component_pkey",
DROP COLUMN "component_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "salary_component_pkey" PRIMARY KEY ("id");

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
DROP TABLE "employment_type";

-- DropTable
DROP TABLE "experience";

-- DropTable
DROP TABLE "holiday_calendar";

-- DropTable
DROP TABLE "languages";

-- DropTable
DROP TABLE "leave_balance";

-- DropTable
DROP TABLE "leave_policy";

-- DropTable
DROP TABLE "leave_policy_employment_type";

-- DropTable
DROP TABLE "leave_request";

-- DropTable
DROP TABLE "leave_type";

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
DROP TYPE "AccountStatusEnum";

-- DropEnum
DROP TYPE "ApplicableGenderEnum";

-- DropEnum
DROP TYPE "AttendanceStatusEnum";

-- DropEnum
DROP TYPE "CalculationTypeEnum";

-- DropEnum
DROP TYPE "EducationLevelEnum";

-- DropEnum
DROP TYPE "EmploymentStatusEnum";

-- DropEnum
DROP TYPE "HalfDaySessionEnum";

-- DropEnum
DROP TYPE "HolidayTypeEnum";

-- DropEnum
DROP TYPE "LanguageProficiency";

-- DropEnum
DROP TYPE "LeaveRequestStatusEnum";

-- DropEnum
DROP TYPE "NotificationTypeEnum";

-- DropEnum
DROP TYPE "PaymentFrequencyEnum";

-- DropEnum
DROP TYPE "PayrollStatusEnum";

-- DropEnum
DROP TYPE "SkillLevel";

-- DropEnum
DROP TYPE "ThemeEnum";
