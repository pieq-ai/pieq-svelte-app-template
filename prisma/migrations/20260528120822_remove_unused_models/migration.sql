/*
  Warnings:

  - You are about to drop the `address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bank_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `company_location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_education` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `experience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `holiday_calendar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_policy_employment_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_component` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structure_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "address";

-- DropTable
DROP TABLE "attendance_record";

-- DropTable
DROP TABLE "audit_log";

-- DropTable
DROP TABLE "bank_details";

-- DropTable
DROP TABLE "company_location";

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
DROP TABLE "holiday_calendar";

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
DROP TABLE "notification";

-- DropTable
DROP TABLE "payroll";

-- DropTable
DROP TABLE "payroll_item";

-- DropTable
DROP TABLE "role";

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
DROP TABLE "user_account";

-- DropTable
DROP TABLE "user_session";

-- DropTable
DROP TABLE "user_settings";

-- DropEnum
DROP TYPE "AccountStatusEnum";

-- DropEnum
DROP TYPE "AttendanceStatusEnum";

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
DROP TYPE "PayrollStatusEnum";

-- DropEnum
DROP TYPE "SalaryComponentTypeEnum";

-- DropEnum
DROP TYPE "SkillLevel";
