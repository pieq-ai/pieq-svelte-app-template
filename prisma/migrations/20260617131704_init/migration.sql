-- CreateTable
CREATE TABLE "salary_components" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "component_type" VARCHAR(20) NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "shift_name" VARCHAR(100) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "minimum_work_hours" DECIMAL(4,2) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(255),
    "updated_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "system_role_cuid" TEXT NOT NULL,
    "permission_cuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_groups" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "blood_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_grades" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "pay_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relation_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "relation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "country_cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sources" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "attendance_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "emp_code" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "father_name" VARCHAR(150),
    "dob" DATE,
    "gender" VARCHAR(20),
    "marital_status" VARCHAR(20),
    "blood_group_cuid" TEXT,
    "nationality_cuid" TEXT,
    "mobile_no" VARCHAR(20),
    "personal_email" VARCHAR(255),
    "aadhar_no" VARCHAR(20),
    "pan_no" VARCHAR(20),
    "uan_no" VARCHAR(30),
    "esi_no" VARCHAR(30),
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_no" VARCHAR(20),
    "relation_cuid" TEXT,
    "remarks" TEXT,
    "profile_completion_status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employments" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "department_cuid" TEXT NOT NULL,
    "role_cuid" TEXT,
    "designation_cuid" TEXT NOT NULL,
    "pay_grade_cuid" TEXT,
    "employment_type_cuid" TEXT,
    "location_cuid" TEXT,
    "reporting_manager_cuid" TEXT,
    "employment_status" VARCHAR(30) NOT NULL DEFAULT 'onboarding',
    "date_of_joining" DATE,
    "confirmation_date" DATE,
    "relieving_date" DATE,
    "official_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "skill_cuid" TEXT NOT NULL,
    "proficiency_level" VARCHAR(20),
    "years_of_experience" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_languages" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "language_cuid" TEXT NOT NULL,
    "proficiency_level" VARCHAR(20),
    "can_read" BOOLEAN NOT NULL DEFAULT false,
    "can_write" BOOLEAN NOT NULL DEFAULT false,
    "can_speak" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employee_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_educations" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "education_level" VARCHAR(30) NOT NULL,
    "specialization" VARCHAR(150),
    "institution" VARCHAR(255),
    "university_board" VARCHAR(255),
    "percentage" DECIMAL(5,2),
    "completed_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employee_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_experiences" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(150),
    "description" TEXT,
    "from_date" DATE,
    "to_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employee_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "document_type_cuid" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "file_name" VARCHAR(255),
    "file_size" BIGINT,
    "document" BYTEA,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "address_type" VARCHAR(30) NOT NULL DEFAULT 'communication',
    "door_no" VARCHAR(50),
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state_cuid" TEXT NOT NULL,
    "country_cuid" TEXT NOT NULL,
    "pin_code" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "account_holder_name" VARCHAR(150) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "bank_name" VARCHAR(150) NOT NULL,
    "branch_name" VARCHAR(150),
    "ifsc_code" VARCHAR(20) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_locations" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state_cuid" TEXT NOT NULL,
    "country_cuid" TEXT NOT NULL,
    "pin_code" VARCHAR(15) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_name" VARCHAR(100) NOT NULL,
    "leave_code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_type_cuid" TEXT NOT NULL,
    "annual_limit" DECIMAL(5,1) NOT NULL,
    "max_per_month" DECIMAL(4,1),
    "carry_forward_allowed" BOOLEAN NOT NULL DEFAULT false,
    "max_carry_forward_days" DECIMAL(4,1),
    "document_required" BOOLEAN NOT NULL DEFAULT false,
    "document_required_after_days" INTEGER,
    "min_service_days" INTEGER NOT NULL DEFAULT 0,
    "allow_half_day" BOOLEAN NOT NULL DEFAULT false,
    "gender_specific" BOOLEAN NOT NULL DEFAULT false,
    "applicable_gender" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deactivated_by_leave_type" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policy_employment_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_policy_cuid" TEXT NOT NULL,
    "employment_type_cuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_policy_employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendars" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "holiday_name" VARCHAR(200) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "holiday_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_cuid_key" ON "salary_components"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_name_key" ON "salary_components"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_cuid_key" ON "shifts"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_shift_name_key" ON "shifts"("shift_name");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_cuid_key" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_name_key" ON "system_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_cuid_key" ON "departments"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_cuid_key" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_cuid_key" ON "role_permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_system_role_cuid_permission_cuid_key" ON "role_permissions"("system_role_cuid", "permission_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_groups_cuid_key" ON "blood_groups"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_groups_name_key" ON "blood_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designations_cuid_key" ON "designations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designations_name_key" ON "designations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grades_cuid_key" ON "pay_grades"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grades_name_key" ON "pay_grades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_cuid_key" ON "nationalities"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_name_key" ON "nationalities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_cuid_key" ON "employment_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_name_key" ON "employment_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "relation_types_cuid_key" ON "relation_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "relation_types_name_key" ON "relation_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_cuid_key" ON "document_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_cuid_key" ON "states"("cuid");

-- CreateIndex
CREATE INDEX "states_country_cuid_idx" ON "states"("country_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "states_country_cuid_name_key" ON "states"("country_cuid", "name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_cuid_key" ON "countries"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_cuid_key" ON "skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sources_cuid_key" ON "attendance_sources"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sources_name_key" ON "attendance_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_cuid_key" ON "languages"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cuid_key" ON "employees"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employees_emp_code_key" ON "employees"("emp_code");

-- CreateIndex
CREATE UNIQUE INDEX "employments_cuid_key" ON "employments"("cuid");

-- CreateIndex
CREATE INDEX "employments_employee_cuid_idx" ON "employments"("employee_cuid");

-- CreateIndex
CREATE INDEX "employments_department_cuid_idx" ON "employments"("department_cuid");

-- CreateIndex
CREATE INDEX "employments_designation_cuid_idx" ON "employments"("designation_cuid");

-- CreateIndex
CREATE INDEX "employments_role_cuid_idx" ON "employments"("role_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skills_cuid_key" ON "employee_skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skills_employee_cuid_skill_cuid_key" ON "employee_skills"("employee_cuid", "skill_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_languages_cuid_key" ON "employee_languages"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_languages_employee_cuid_language_cuid_key" ON "employee_languages"("employee_cuid", "language_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_educations_cuid_key" ON "employee_educations"("cuid");

-- CreateIndex
CREATE INDEX "employee_educations_employee_cuid_idx" ON "employee_educations"("employee_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_experiences_cuid_key" ON "employee_experiences"("cuid");

-- CreateIndex
CREATE INDEX "employee_experiences_employee_cuid_idx" ON "employee_experiences"("employee_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employee_documents_cuid_key" ON "employee_documents"("cuid");

-- CreateIndex
CREATE INDEX "employee_documents_employee_cuid_idx" ON "employee_documents"("employee_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_cuid_key" ON "addresses"("cuid");

-- CreateIndex
CREATE INDEX "addresses_employee_cuid_idx" ON "addresses"("employee_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_cuid_key" ON "bank_details"("cuid");

-- CreateIndex
CREATE INDEX "bank_details_employee_cuid_idx" ON "bank_details"("employee_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "roles_cuid_key" ON "roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_locations_cuid_key" ON "company_locations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "company_locations_name_key" ON "company_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_cuid_key" ON "leave_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_name_key" ON "leave_types"("leave_name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_code_key" ON "leave_types"("leave_code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_cuid_key" ON "leave_policies"("cuid");

-- CreateIndex
CREATE INDEX "leave_policies_leave_type_cuid_idx" ON "leave_policies"("leave_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_types_cuid_key" ON "leave_policy_employment_types"("cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_types_leave_policy_cuid_idx" ON "leave_policy_employment_types"("leave_policy_cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_types_employment_type_cuid_idx" ON "leave_policy_employment_types"("employment_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_types_leave_policy_cuid_employment__key" ON "leave_policy_employment_types"("leave_policy_cuid", "employment_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendars_cuid_key" ON "holiday_calendars"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendars_holiday_name_holiday_date_key" ON "holiday_calendars"("holiday_name", "holiday_date");
