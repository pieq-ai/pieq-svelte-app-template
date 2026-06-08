-- CreateTable
CREATE TABLE "system_roles" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "dept_name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "role_permission" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "system_role_cuid" TEXT NOT NULL,
    "permission_cuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_group" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "blood_group_name" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "blood_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designation" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "designation_name" VARCHAR(150) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_grade" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "paygrade_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "pay_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationality" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "nationality_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "nationality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_type" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employment_name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "employment_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relation_type" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "relation_name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "relation_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "document_type_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "country_cuid" TEXT NOT NULL,
    "state_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "attendance_source" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "attendance_source_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "attendance_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "languages_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_cuid_key" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_system_role_name_key" ON "system_roles"("system_role_name");

-- CreateIndex
CREATE INDEX "system_roles_cuid_idx" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "department_cuid_key" ON "department"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "department_dept_name_key" ON "department"("dept_name");

-- CreateIndex
CREATE INDEX "department_cuid_idx" ON "department"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_cuid_key" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE INDEX "permissions_cuid_idx" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_cuid_key" ON "role_permission"("cuid");

-- CreateIndex
CREATE INDEX "role_permission_cuid_idx" ON "role_permission"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_system_role_cuid_permission_cuid_key" ON "role_permission"("system_role_cuid", "permission_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_group_cuid_key" ON "blood_group"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "blood_group_blood_group_name_key" ON "blood_group"("blood_group_name");

-- CreateIndex
CREATE INDEX "blood_group_cuid_idx" ON "blood_group"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designation_cuid_key" ON "designation"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "designation_designation_name_key" ON "designation"("designation_name");

-- CreateIndex
CREATE INDEX "designation_cuid_idx" ON "designation"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_cuid_key" ON "pay_grade"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_paygrade_name_key" ON "pay_grade"("paygrade_name");

-- CreateIndex
CREATE INDEX "pay_grade_cuid_idx" ON "pay_grade"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "nationality_cuid_key" ON "nationality"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "nationality_nationality_name_key" ON "nationality"("nationality_name");

-- CreateIndex
CREATE INDEX "nationality_cuid_idx" ON "nationality"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_type_cuid_key" ON "employment_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_type_employment_name_key" ON "employment_type"("employment_name");

-- CreateIndex
CREATE INDEX "employment_type_cuid_idx" ON "employment_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "relation_type_cuid_key" ON "relation_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "relation_type_relation_name_key" ON "relation_type"("relation_name");

-- CreateIndex
CREATE INDEX "relation_type_cuid_idx" ON "relation_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_cuid_key" ON "document_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_document_type_name_key" ON "document_type"("document_type_name");

-- CreateIndex
CREATE INDEX "document_type_cuid_idx" ON "document_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "state_cuid_key" ON "state"("cuid");

-- CreateIndex
CREATE INDEX "state_country_cuid_idx" ON "state"("country_cuid");

-- CreateIndex
CREATE INDEX "state_cuid_idx" ON "state"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "state_country_cuid_state_name_key" ON "state"("country_cuid", "state_name");

-- CreateIndex
CREATE UNIQUE INDEX "country_cuid_key" ON "country"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "country_country_name_key" ON "country"("country_name");

-- CreateIndex
CREATE INDEX "country_cuid_idx" ON "country"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "skills_cuid_key" ON "skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "skills_skills_name_key" ON "skills"("skills_name");

-- CreateIndex
CREATE INDEX "skills_cuid_idx" ON "skills"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_source_cuid_key" ON "attendance_source"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_source_attendance_source_name_key" ON "attendance_source"("attendance_source_name");

-- CreateIndex
CREATE INDEX "attendance_source_cuid_idx" ON "attendance_source"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "languages_cuid_key" ON "languages"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "languages_languages_name_key" ON "languages"("languages_name");

-- CreateIndex
CREATE INDEX "languages_cuid_idx" ON "languages"("cuid");
