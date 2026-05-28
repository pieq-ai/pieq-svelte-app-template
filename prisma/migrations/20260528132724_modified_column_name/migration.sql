/*
  Warnings:

  - You are about to drop the column `uuid` on the `employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `holiday_calendar` table. All the data in the column will be lost.
  - You are about to drop the column `leave_type_cuid` on the `leave_policy` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `leave_policy` table. All the data in the column will be lost.
  - You are about to drop the column `employment_type_cuid` on the `leave_policy_employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `leave_policy_cuid` on the `leave_policy_employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `leave_policy_employment_type` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `leave_type` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuid]` on the table `employment_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `holiday_calendar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `leave_policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `leave_policy_employment_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leave_policy_uuid,employment_type_uuid]` on the table `leave_policy_employment_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `leave_type` will be added. If there are existing duplicate values, this will fail.
  - The required column `cuid` was added to the `employment_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid` was added to the `holiday_calendar` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `cuid` was added to the `leave_policy` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `leave_type_uuid` to the `leave_policy` table without a default value. This is not possible if the table is not empty.
  - The required column `cuid` was added to the `leave_policy_employment_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `employment_type_uuid` to the `leave_policy_employment_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_policy_uuid` to the `leave_policy_employment_type` table without a default value. This is not possible if the table is not empty.
  - The required column `cuid` was added to the `leave_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "employment_type_uuid_key";

-- DropIndex
DROP INDEX "holiday_calendar_uuid_key";

-- DropIndex
DROP INDEX "leave_policy_leave_type_cuid_idx";

-- DropIndex
DROP INDEX "leave_policy_uuid_key";

-- DropIndex
DROP INDEX "leave_policy_employment_type_employment_type_cuid_idx";

-- DropIndex
DROP INDEX "leave_policy_employment_type_leave_policy_cuid_employment_t_key";

-- DropIndex
DROP INDEX "leave_policy_employment_type_leave_policy_cuid_idx";

-- DropIndex
DROP INDEX "leave_policy_employment_type_uuid_key";

-- DropIndex
DROP INDEX "leave_type_uuid_key";

-- AlterTable
ALTER TABLE "employment_type" DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "holiday_calendar" DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_policy" DROP COLUMN "leave_type_cuid",
DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT NOT NULL,
ADD COLUMN     "leave_type_uuid" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "leave_policy_employment_type" DROP COLUMN "employment_type_cuid",
DROP COLUMN "leave_policy_cuid",
DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT NOT NULL,
ADD COLUMN     "employment_type_uuid" VARCHAR(50) NOT NULL,
ADD COLUMN     "leave_policy_uuid" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "leave_type" DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employment_type_cuid_key" ON "employment_type"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendar_cuid_key" ON "holiday_calendar"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_cuid_key" ON "leave_policy"("cuid");

-- CreateIndex
CREATE INDEX "leave_policy_leave_type_uuid_idx" ON "leave_policy"("leave_type_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_type_cuid_key" ON "leave_policy_employment_type"("cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_leave_policy_uuid_idx" ON "leave_policy_employment_type"("leave_policy_uuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_type_employment_type_uuid_idx" ON "leave_policy_employment_type"("employment_type_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_type_leave_policy_uuid_employment_t_key" ON "leave_policy_employment_type"("leave_policy_uuid", "employment_type_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_cuid_key" ON "leave_type"("cuid");
