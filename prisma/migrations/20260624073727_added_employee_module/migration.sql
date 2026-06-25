

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
    "aadhar_no" VARCHAR(12),
    "pan_no" VARCHAR(10),
    "uan_no" VARCHAR(30),
    "esi_no" VARCHAR(30),
    "pf_account_no" VARCHAR(22),
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_no" VARCHAR(20),
    "relation_cuid" TEXT,
    "remarks" TEXT,
    "profile_completion_status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
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

-- CreateIndex
CREATE UNIQUE INDEX "employees_cuid_key" ON "employees"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employees_emp_code_key" ON "employees"("emp_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pf_account_no_key" ON "employees"("pf_account_no");

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
