-- CreateTable
CREATE TABLE "salary_components" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "component_name" VARCHAR(150) NOT NULL,
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
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "role_name" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(255),
    "updated_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "company_locations" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "location_name" VARCHAR(150) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state_cuid" VARCHAR(50) NOT NULL,
    "country_cuid" VARCHAR(50) NOT NULL,
    "pin_code" VARCHAR(10) NOT NULL,
    "timezone" VARCHAR(60) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(255),
    "updated_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "system_role_name" VARCHAR(100) NOT NULL,
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
    "dept_name" VARCHAR(150) NOT NULL,
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
    "blood_group_name" VARCHAR(5) NOT NULL,
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
    "designation_name" VARCHAR(150) NOT NULL,
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
    "paygrade_name" VARCHAR(100) NOT NULL,
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
    "nationality_name" VARCHAR(100) NOT NULL,
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
    "employment_name" VARCHAR(50) NOT NULL,
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
    "relation_name" VARCHAR(50) NOT NULL,
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
    "document_type_name" VARCHAR(100) NOT NULL,
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
    "state_name" VARCHAR(100) NOT NULL,
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
    "country_name" VARCHAR(100) NOT NULL,
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
    "skills_name" VARCHAR(100) NOT NULL,
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
    "attendance_source_name" VARCHAR(100) NOT NULL,
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
    "languages_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
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
    "name" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "check_in_time" TIMESTAMPTZ(3),
    "check_out_time" TIMESTAMPTZ(3),
    "work_duration_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "attendance_source_cuid" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "check_in_latitude" DOUBLE PRECISION,
    "check_in_longitude" DOUBLE PRECISION,
    "check_out_latitude" DOUBLE PRECISION,
    "check_out_longitude" DOUBLE PRECISION,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_cuid_key" ON "salary_components"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_component_name_key" ON "salary_components"("component_name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_cuid_key" ON "roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_cuid_key" ON "shifts"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_shift_name_key" ON "shifts"("shift_name");

-- CreateIndex
CREATE UNIQUE INDEX "company_locations_cuid_key" ON "company_locations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "company_locations_location_name_key" ON "company_locations"("location_name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_uuid_key" ON "employees"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_cuid_key" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_system_role_name_key" ON "system_roles"("system_role_name");

-- CreateIndex
CREATE INDEX "system_roles_cuid_idx" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "departments_cuid_key" ON "departments"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "departments_dept_name_key" ON "departments"("dept_name");

-- CreateIndex
CREATE INDEX "departments_cuid_idx" ON "departments"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_cuid_key" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE INDEX "permissions_cuid_idx" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_cuid_key" ON "role_permissions"("cuid");

-- CreateIndex
CREATE INDEX "role_permissions_cuid_idx" ON "role_permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_system_role_cuid_permission_cuid_key" ON "role_permissions"("system_role_cuid", "permission_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_groups_cuid_key" ON "blood_groups"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_groups_blood_group_name_key" ON "blood_groups"("blood_group_name");

-- CreateIndex
CREATE INDEX "blood_groups_cuid_idx" ON "blood_groups"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designations_cuid_key" ON "designations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designations_designation_name_key" ON "designations"("designation_name");

-- CreateIndex
CREATE INDEX "designations_cuid_idx" ON "designations"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grades_cuid_key" ON "pay_grades"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grades_paygrade_name_key" ON "pay_grades"("paygrade_name");

-- CreateIndex
CREATE INDEX "pay_grades_cuid_idx" ON "pay_grades"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_cuid_key" ON "nationalities"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_nationality_name_key" ON "nationalities"("nationality_name");

-- CreateIndex
CREATE INDEX "nationalities_cuid_idx" ON "nationalities"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_cuid_key" ON "employment_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_employment_name_key" ON "employment_types"("employment_name");

-- CreateIndex
CREATE INDEX "employment_types_cuid_idx" ON "employment_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "relation_types_cuid_key" ON "relation_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "relation_types_relation_name_key" ON "relation_types"("relation_name");

-- CreateIndex
CREATE INDEX "relation_types_cuid_idx" ON "relation_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_cuid_key" ON "document_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_document_type_name_key" ON "document_types"("document_type_name");

-- CreateIndex
CREATE INDEX "document_types_cuid_idx" ON "document_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "states_cuid_key" ON "states"("cuid");

-- CreateIndex
CREATE INDEX "states_country_cuid_idx" ON "states"("country_cuid");

-- CreateIndex
CREATE INDEX "states_cuid_idx" ON "states"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "states_country_cuid_state_name_key" ON "states"("country_cuid", "state_name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_cuid_key" ON "countries"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_name_key" ON "countries"("country_name");

-- CreateIndex
CREATE INDEX "countries_cuid_idx" ON "countries"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "skills_cuid_key" ON "skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "skills_skills_name_key" ON "skills"("skills_name");

-- CreateIndex
CREATE INDEX "skills_cuid_idx" ON "skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sources_cuid_key" ON "attendance_sources"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sources_attendance_source_name_key" ON "attendance_sources"("attendance_source_name");

-- CreateIndex
CREATE INDEX "attendance_sources_cuid_idx" ON "attendance_sources"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "languages_cuid_key" ON "languages"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "languages_languages_name_key" ON "languages"("languages_name");

-- CreateIndex
CREATE INDEX "languages_cuid_idx" ON "languages"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_cuid_key" ON "leave_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_code_key" ON "leave_types"("code");

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
CREATE UNIQUE INDEX "holiday_calendars_name_date_key" ON "holiday_calendars"("name", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_cuid_key" ON "attendance_records"("cuid");

-- CreateIndex
CREATE INDEX "attendance_records_employee_cuid_idx" ON "attendance_records"("employee_cuid");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employee_cuid_date_key" ON "attendance_records"("employee_cuid", "date");
