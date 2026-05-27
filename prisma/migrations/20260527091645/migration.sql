/*
  Warnings:

  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('Male', 'Female', 'Others');

-- CreateEnum
CREATE TYPE "MaritalStatusEnum" AS ENUM ('married', 'single', 'divorced', 'widowed');

-- CreateEnum
CREATE TYPE "EmploymentStatusEnum" AS ENUM ('Active', 'OnNotice', 'Resigned', 'Terminated', 'Onboarding');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('Basic', 'Conversational', 'Professional', 'Native');

-- CreateEnum
CREATE TYPE "AccountStatusEnum" AS ENUM ('Active', 'Locked', 'Disabled');

-- CreateEnum
CREATE TYPE "EducationLevelEnum" AS ENUM ('TENTH', 'TWELFTH', 'DIPLOMA', 'UG', 'PG', 'PHD');

-- CreateEnum
CREATE TYPE "ApplicableGenderEnum" AS ENUM ('Male', 'Female', 'Others');

-- CreateEnum
CREATE TYPE "HalfDaySessionEnum" AS ENUM ('AN', 'FN');

-- CreateEnum
CREATE TYPE "LeaveRequestStatusEnum" AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "AttendanceStatusEnum" AS ENUM ('Present', 'Absent', 'On_Leave', 'HalfDay', 'Holiday', 'WFH');

-- CreateEnum
CREATE TYPE "HolidayTypeEnum" AS ENUM ('national', 'regional', 'restricted');

-- CreateEnum
CREATE TYPE "PayrollStatusEnum" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "SalaryComponentTypeEnum" AS ENUM ('earning', 'deduction');

-- CreateEnum
CREATE TYPE "PaymentFrequencyEnum" AS ENUM ('monthly', 'weekly', 'daily');

-- CreateEnum
CREATE TYPE "CalculationTypeEnum" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "NotificationTypeEnum" AS ENUM ('info', 'warning', 'success', 'error');

-- CreateEnum
CREATE TYPE "ThemeEnum" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "MasterStatusEnum" AS ENUM ('active', 'inactive');

-- DropTable
DROP TABLE "employees";

-- CreateTable
CREATE TABLE "employee" (
    "emp_id" BIGSERIAL NOT NULL,
    "emp_code" VARCHAR(20) NOT NULL,
    "uuid" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "GenderEnum" NOT NULL,
    "blood_group_id" INTEGER NOT NULL,
    "marital_status" "MaritalStatusEnum" NOT NULL,
    "nationality_id" INTEGER NOT NULL,
    "mobile_no" VARCHAR(15) NOT NULL,
    "personal_email" VARCHAR(255) NOT NULL,
    "aadhar_no" VARCHAR(12) NOT NULL,
    "pan_no" VARCHAR(10) NOT NULL,
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_no" VARCHAR(15),
    "relation_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("emp_id")
);

-- CreateTable
CREATE TABLE "employment" (
    "employment_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "dept_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "designation_id" INTEGER NOT NULL,
    "reporting_to" BIGINT,
    "employment_status" "EmploymentStatusEnum" NOT NULL,
    "doj" DATE NOT NULL,
    "confirmation_date" DATE,
    "exit_date" DATE,
    "official_email" VARCHAR(255) NOT NULL,
    "pay_grade_id" INTEGER NOT NULL,
    "employment_type_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,

    CONSTRAINT "employment_pkey" PRIMARY KEY ("employment_id")
);

-- CreateTable
CREATE TABLE "employee_language" (
    "el_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "language_id" INTEGER NOT NULL,
    "proficiency" "LanguageProficiency" NOT NULL DEFAULT 'Professional',

    CONSTRAINT "employee_language_pkey" PRIMARY KEY ("el_id")
);

-- CreateTable
CREATE TABLE "employee_skill" (
    "es_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "proficiency_level" "SkillLevel" NOT NULL DEFAULT 'Intermediate',
    "years_of_exp" INTEGER,

    CONSTRAINT "employee_skill_pkey" PRIMARY KEY ("es_id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "user_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMPTZ,
    "system_role_id" INTEGER NOT NULL,
    "account_status" "AccountStatusEnum" NOT NULL DEFAULT 'Active',

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "system_role_id" SERIAL NOT NULL,
    "system_role_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("system_role_id")
);

-- CreateTable
CREATE TABLE "address" (
    "address_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "door_no" VARCHAR(20),
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "pin_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "department" (
    "dept_id" SERIAL NOT NULL,
    "dept_name" VARCHAR(150) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "department_pkey" PRIMARY KEY ("dept_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(150) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "bank_id" BIGSERIAL NOT NULL,
    "account_number" VARCHAR(30) NOT NULL,
    "bank_name" VARCHAR(150) NOT NULL,
    "ifsc_code" VARCHAR(11) NOT NULL,
    "branch_name" VARCHAR(150) NOT NULL,
    "account_holder_name" VARCHAR(200) NOT NULL,
    "emp_id" BIGINT NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("bank_id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "emp_doc_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "document_type_id" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "document" BYTEA NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("emp_doc_id")
);

-- CreateTable
CREATE TABLE "employee_education" (
    "edu_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "education" "EducationLevelEnum" NOT NULL,
    "specialization" VARCHAR(200),
    "institution" VARCHAR(300) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "completed_at" DATE NOT NULL,

    CONSTRAINT "employee_education_pkey" PRIMARY KEY ("edu_id")
);

-- CreateTable
CREATE TABLE "experience" (
    "exp_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "company_name" VARCHAR(300) NOT NULL,
    "role" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "from_date" DATE NOT NULL,
    "to_date" DATE,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("exp_id")
);

-- CreateTable
CREATE TABLE "leave_type" (
    "leave_type_id" SERIAL NOT NULL,
    "leave_name" VARCHAR(100) NOT NULL,
    "leave_code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "leave_type_pkey" PRIMARY KEY ("leave_type_id")
);

-- CreateTable
CREATE TABLE "leave_policy" (
    "policy_id" SERIAL NOT NULL,
    "leave_type_id" INTEGER NOT NULL,
    "annual_quota" DECIMAL(5,1) NOT NULL,
    "max_per_month" DECIMAL(4,1),
    "carry_forward_allowed" BOOLEAN NOT NULL DEFAULT false,
    "max_carry_forward_days" DECIMAL(4,1),
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "min_service_days" INTEGER NOT NULL DEFAULT 0,
    "allow_half_day" BOOLEAN NOT NULL DEFAULT false,
    "gender_specific" BOOLEAN NOT NULL DEFAULT false,
    "applicable_gender" "ApplicableGenderEnum",
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "leave_policy_pkey" PRIMARY KEY ("policy_id")
);

-- CreateTable
CREATE TABLE "leave_balance" (
    "balance_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "leave_type_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "allocated_days" DECIMAL(5,1) NOT NULL,
    "used_days" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "remaining_days" DECIMAL(5,1) NOT NULL,
    "carried_forward_days" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leave_balance_pkey" PRIMARY KEY ("balance_id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "leave_request_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "leave_type_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" DECIMAL(4,1) NOT NULL,
    "is_half_day" BOOLEAN NOT NULL DEFAULT false,
    "half_day_session" "HalfDaySessionEnum",
    "reason" TEXT NOT NULL,
    "document_url" TEXT,
    "request_status" "LeaveRequestStatusEnum" NOT NULL DEFAULT 'pending',
    "approved_by" BIGINT,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("leave_request_id")
);

-- CreateTable
CREATE TABLE "attendance_record" (
    "attendance_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIME(6),
    "check_out_time" TIME(6),
    "work_duration_minutes" INTEGER,
    "attendance_status" "AttendanceStatusEnum" NOT NULL,
    "attendance_source_id" INTEGER,
    "remarks" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "holiday_calendar" (
    "holiday_id" SERIAL NOT NULL,
    "holiday_name" VARCHAR(200) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "holiday_type" "HolidayTypeEnum" NOT NULL,

    CONSTRAINT "holiday_calendar_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "payroll_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "salary_structure_id" BIGINT NOT NULL,
    "pay_period_start" DATE NOT NULL,
    "pay_period_end" DATE NOT NULL,
    "working_days" SMALLINT NOT NULL,
    "present_days" DECIMAL(4,1) NOT NULL,
    "paid_leave_days" DECIMAL(4,1) NOT NULL,
    "lop_days" DECIMAL(4,1) NOT NULL,
    "gross_salary" DECIMAL(14,2) NOT NULL,
    "total_earnings" DECIMAL(14,2) NOT NULL,
    "total_deductions" DECIMAL(14,2) NOT NULL,
    "net_salary" DECIMAL(14,2) NOT NULL,
    "payroll_status" "PayrollStatusEnum" NOT NULL DEFAULT 'pending',
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" BIGINT,
    "generated_doc" BYTEA,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("payroll_id")
);

-- CreateTable
CREATE TABLE "salary_component" (
    "component_id" SERIAL NOT NULL,
    "component_name" VARCHAR(150) NOT NULL,
    "component_type" "SalaryComponentTypeEnum" NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "salary_component_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "salary_structure" (
    "salary_structure_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "gross_salary" DECIMAL(14,2) NOT NULL,
    "payment_frequency" "PaymentFrequencyEnum" NOT NULL DEFAULT 'monthly',
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_structure_pkey" PRIMARY KEY ("salary_structure_id")
);

-- CreateTable
CREATE TABLE "salary_structure_item" (
    "item_id" BIGSERIAL NOT NULL,
    "salary_structure_id" BIGINT NOT NULL,
    "component_id" INTEGER NOT NULL,
    "calculation_type" "CalculationTypeEnum" NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_structure_item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "payroll_item" (
    "payroll_item_id" BIGSERIAL NOT NULL,
    "payroll_id" BIGINT NOT NULL,
    "component_id" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "payroll_item_pkey" PRIMARY KEY ("payroll_item_id")
);

-- CreateTable
CREATE TABLE "shift" (
    "shift_id" SERIAL NOT NULL,
    "shift_name" VARCHAR(100) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "minimum_work_hours" DECIMAL(4,2) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "shift_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "shift_assignment" (
    "assignment_id" BIGSERIAL NOT NULL,
    "emp_id" BIGINT NOT NULL,
    "shift_id" INTEGER NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,

    CONSTRAINT "shift_assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "audit_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "entity_name" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" SERIAL NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_permission_id" SERIAL NOT NULL,
    "system_role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateTable
CREATE TABLE "user_session" (
    "session_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ,

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" "NotificationTypeEnum" NOT NULL DEFAULT 'info',
    "reference_type" VARCHAR(100),
    "reference_id" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "setting_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "theme" "ThemeEnum" NOT NULL DEFAULT 'system',
    "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "company_location" (
    "location_id" SERIAL NOT NULL,
    "location_name" VARCHAR(150) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "pin_code" VARCHAR(10) NOT NULL,
    "timezone" VARCHAR(60) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "blood_group" (
    "blood_group_id" SERIAL NOT NULL,
    "blood_group_name" VARCHAR(5) NOT NULL,

    CONSTRAINT "blood_group_pkey" PRIMARY KEY ("blood_group_id")
);

-- CreateTable
CREATE TABLE "designation" (
    "designation_id" SERIAL NOT NULL,
    "designation_name" VARCHAR(150) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "designation_pkey" PRIMARY KEY ("designation_id")
);

-- CreateTable
CREATE TABLE "pay_grade" (
    "paygrade_id" SERIAL NOT NULL,
    "paygrade_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "pay_grade_pkey" PRIMARY KEY ("paygrade_id")
);

-- CreateTable
CREATE TABLE "nationality" (
    "nationality_id" SERIAL NOT NULL,
    "nationality_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "nationality_pkey" PRIMARY KEY ("nationality_id")
);

-- CreateTable
CREATE TABLE "employment_type" (
    "employment_type_id" SERIAL NOT NULL,
    "employment_name" VARCHAR(50) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "employment_type_pkey" PRIMARY KEY ("employment_type_id")
);

-- CreateTable
CREATE TABLE "relation_type" (
    "relation_id" SERIAL NOT NULL,
    "relation_name" VARCHAR(50) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "relation_type_pkey" PRIMARY KEY ("relation_id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "document_type_id" SERIAL NOT NULL,
    "document_type_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("document_type_id")
);

-- CreateTable
CREATE TABLE "state" (
    "state_id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "state_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "state_pkey" PRIMARY KEY ("state_id")
);

-- CreateTable
CREATE TABLE "country" (
    "country_id" SERIAL NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "skills" (
    "skills_id" SERIAL NOT NULL,
    "skills_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skills_id")
);

-- CreateTable
CREATE TABLE "attendance_source" (
    "attendance_source_id" SERIAL NOT NULL,
    "attendance_source_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "attendance_source_pkey" PRIMARY KEY ("attendance_source_id")
);

-- CreateTable
CREATE TABLE "languages" (
    "languages_id" SERIAL NOT NULL,
    "languages_name" VARCHAR(100) NOT NULL,
    "status" "MasterStatusEnum" NOT NULL DEFAULT 'active',

    CONSTRAINT "languages_pkey" PRIMARY KEY ("languages_id")
);

-- CreateTable
CREATE TABLE "leave_policy_employment_type" (
    "lpet_id" SERIAL NOT NULL,
    "policy_id" INTEGER NOT NULL,
    "employment_type_id" INTEGER NOT NULL,

    CONSTRAINT "leave_policy_employment_type_pkey" PRIMARY KEY ("lpet_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_emp_code_key" ON "employee"("emp_code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_uuid_key" ON "employee"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_mobile_no_key" ON "employee"("mobile_no");

-- CreateIndex
CREATE UNIQUE INDEX "employee_personal_email_key" ON "employee"("personal_email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_aadhar_no_key" ON "employee"("aadhar_no");

-- CreateIndex
CREATE UNIQUE INDEX "employee_pan_no_key" ON "employee"("pan_no");

-- CreateIndex
CREATE UNIQUE INDEX "employment_uuid_key" ON "employment"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_emp_id_key" ON "employment"("emp_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_official_email_key" ON "employment"("official_email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_language_emp_id_language_id_key" ON "employee_language"("emp_id", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skill_emp_id_skill_id_key" ON "employee_skill"("emp_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_uuid_key" ON "user_account"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_emp_id_key" ON "user_account"("emp_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_username_key" ON "user_account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_system_role_name_key" ON "system_roles"("system_role_name");

-- CreateIndex
CREATE UNIQUE INDEX "department_dept_name_key" ON "department"("dept_name");

-- CreateIndex
CREATE UNIQUE INDEX "role_role_name_key" ON "role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_emp_id_key" ON "bank_details"("emp_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_documents_uuid_key" ON "employee_documents"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_leave_name_key" ON "leave_type"("leave_name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_leave_code_key" ON "leave_type"("leave_code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balance_emp_id_leave_type_id_year_key" ON "leave_balance"("emp_id", "leave_type_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_request_uuid_key" ON "leave_request"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_record_emp_id_attendance_date_key" ON "attendance_record"("emp_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendar_holiday_name_holiday_date_key" ON "holiday_calendar"("holiday_name", "holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_uuid_key" ON "payroll"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_emp_id_pay_period_start_pay_period_end_key" ON "payroll"("emp_id", "pay_period_start", "pay_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "salary_component_component_name_component_type_key" ON "salary_component"("component_name", "component_type");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_uuid_key" ON "salary_structure"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_item_salary_structure_id_component_id_key" ON "salary_structure_item"("salary_structure_id", "component_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_item_payroll_id_component_id_key" ON "payroll_item"("payroll_id", "component_id");

-- CreateIndex
CREATE UNIQUE INDEX "shift_shift_name_key" ON "shift"("shift_name");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_uuid_key" ON "audit_log"("uuid");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_name_entity_id_idx" ON "audit_log"("entity_name", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_system_role_id_permission_id_key" ON "role_permission"("system_role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_uuid_key" ON "user_session"("uuid");

-- CreateIndex
CREATE INDEX "user_session_user_id_idx" ON "user_session"("user_id");

-- CreateIndex
CREATE INDEX "user_session_expires_at_idx" ON "user_session"("expires_at");

-- CreateIndex
CREATE INDEX "user_session_is_revoked_idx" ON "user_session"("is_revoked");

-- CreateIndex
CREATE UNIQUE INDEX "notification_uuid_key" ON "notification"("uuid");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "notification_is_read_idx" ON "notification"("is_read");

-- CreateIndex
CREATE INDEX "notification_created_at_idx" ON "notification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_location_location_name_key" ON "company_location"("location_name");

-- CreateIndex
CREATE UNIQUE INDEX "blood_group_blood_group_name_key" ON "blood_group"("blood_group_name");

-- CreateIndex
CREATE UNIQUE INDEX "designation_designation_name_key" ON "designation"("designation_name");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_paygrade_name_key" ON "pay_grade"("paygrade_name");

-- CreateIndex
CREATE UNIQUE INDEX "nationality_nationality_name_key" ON "nationality"("nationality_name");

-- CreateIndex
CREATE UNIQUE INDEX "employment_type_employment_name_key" ON "employment_type"("employment_name");

-- CreateIndex
CREATE UNIQUE INDEX "relation_type_relation_name_key" ON "relation_type"("relation_name");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_document_type_name_key" ON "document_type"("document_type_name");

-- CreateIndex
CREATE INDEX "state_country_id_idx" ON "state"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "state_country_id_state_name_key" ON "state"("country_id", "state_name");

-- CreateIndex
CREATE UNIQUE INDEX "country_country_name_key" ON "country"("country_name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_skills_name_key" ON "skills"("skills_name");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_source_attendance_source_name_key" ON "attendance_source"("attendance_source_name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_languages_name_key" ON "languages"("languages_name");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_policy_id_idx" ON "leave_policy_employment_type"("policy_id");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_employment_type_id_idx" ON "leave_policy_employment_type"("employment_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_type_policy_id_employment_type_id_key" ON "leave_policy_employment_type"("policy_id", "employment_type_id");
