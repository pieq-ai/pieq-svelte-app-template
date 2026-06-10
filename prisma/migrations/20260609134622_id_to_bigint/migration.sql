/*
  Warnings:

  - The primary key for the `attendance_sources` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `blood_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_locations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `countries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `designations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `document_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `employment_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `nationalities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `pay_grades` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `relation_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `shifts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `skills` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `states` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `system_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "attendance_sources" DROP CONSTRAINT "attendance_sources_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "attendance_sources_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "blood_groups" DROP CONSTRAINT "blood_groups_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "blood_groups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "company_locations" DROP CONSTRAINT "company_locations_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "countries" DROP CONSTRAINT "countries_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "designations" DROP CONSTRAINT "designations_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "document_types" DROP CONSTRAINT "document_types_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "document_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employees" DROP CONSTRAINT "employees_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employment_types" DROP CONSTRAINT "employment_types_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "languages" DROP CONSTRAINT "languages_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "nationalities" DROP CONSTRAINT "nationalities_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pay_grades" DROP CONSTRAINT "pay_grades_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "pay_grades_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "relation_types" DROP CONSTRAINT "relation_types_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "relation_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "skills" DROP CONSTRAINT "skills_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "states" DROP CONSTRAINT "states_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "system_roles" DROP CONSTRAINT "system_roles_pkey",
ALTER COLUMN "id" SET DATA TYPE bigint,
ADD CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id");
