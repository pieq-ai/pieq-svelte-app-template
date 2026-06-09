/*
  Warnings:

  - You are about to drop the `attendance_source` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blood_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `designation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employment_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nationality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pay_grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relation_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `state` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "attendance_source";

-- DropTable
DROP TABLE "blood_group";

-- DropTable
DROP TABLE "country";

-- DropTable
DROP TABLE "department";

-- DropTable
DROP TABLE "designation";

-- DropTable
DROP TABLE "document_type";

-- DropTable
DROP TABLE "employment_type";

-- DropTable
DROP TABLE "nationality";

-- DropTable
DROP TABLE "pay_grade";

-- DropTable
DROP TABLE "relation_type";

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "state";

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sources" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "attendance_source_name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "attendance_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_cuid_key" ON "departments"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "departments_dept_name_key" ON "departments"("dept_name");

-- CreateIndex
CREATE INDEX "departments_cuid_idx" ON "departments"("cuid");

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
CREATE UNIQUE INDEX "attendance_sources_cuid_key" ON "attendance_sources"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sources_attendance_source_name_key" ON "attendance_sources"("attendance_source_name");

-- CreateIndex
CREATE INDEX "attendance_sources_cuid_idx" ON "attendance_sources"("cuid");
