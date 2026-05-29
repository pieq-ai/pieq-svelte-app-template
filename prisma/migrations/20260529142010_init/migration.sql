-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('Male', 'Female', 'Others');

-- CreateEnum
CREATE TYPE "MaritalStatusEnum" AS ENUM ('married', 'single', 'divorced', 'widowed');

-- CreateTable
CREATE TABLE "employee" (
    "emp_id" BIGSERIAL NOT NULL,
    "emp_code" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "GenderEnum" NOT NULL,
    "marital_status" "MaritalStatusEnum" NOT NULL,
    "mobile_no" VARCHAR(15) NOT NULL,
    "personal_email" VARCHAR(255) NOT NULL,
    "aadhar_no" VARCHAR(12) NOT NULL,
    "pan_no" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("emp_id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "employee_emp_code_key" ON "employee"("emp_code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_mobile_no_key" ON "employee"("mobile_no");

-- CreateIndex
CREATE UNIQUE INDEX "employee_personal_email_key" ON "employee"("personal_email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_aadhar_no_key" ON "employee"("aadhar_no");

-- CreateIndex
CREATE UNIQUE INDEX "employee_pan_no_key" ON "employee"("pan_no");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_cuid_key" ON "salary_components"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_component_name_component_type_key" ON "salary_components"("component_name", "component_type");
