-- AlterTable
ALTER TABLE "attendance_sources" DROP CONSTRAINT "attendance_sources_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "attendance_sources_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "blood_groups" DROP CONSTRAINT "blood_groups_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "blood_groups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "countries" DROP CONSTRAINT "countries_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "designations" DROP CONSTRAINT "designations_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "document_types" DROP CONSTRAINT "document_types_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "document_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employees" DROP CONSTRAINT "employees_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employment_types" DROP CONSTRAINT "employment_types_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "languages" DROP CONSTRAINT "languages_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "nationalities" DROP CONSTRAINT "nationalities_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pay_grades" DROP CONSTRAINT "pay_grades_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "pay_grades_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "relation_types" DROP CONSTRAINT "relation_types_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "relation_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "skills" DROP CONSTRAINT "skills_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "states" DROP CONSTRAINT "states_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "system_roles" DROP CONSTRAINT "system_roles_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id");

