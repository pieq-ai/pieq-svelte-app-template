-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_cuid_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_system_role_cuid_fkey";

-- DropForeignKey
ALTER TABLE "state" DROP CONSTRAINT "state_country_cuid_fkey";
