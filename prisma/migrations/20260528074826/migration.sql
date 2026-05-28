/*
  Warnings:

  - You are about to drop the column `uuid` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuid]` on the table `company_location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `shift` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "roles_uuid_key";

-- AlterTable
ALTER TABLE "company_location" ADD COLUMN     "cuid" TEXT;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "uuid",
ADD COLUMN     "cuid" TEXT;

-- AlterTable
ALTER TABLE "shift" ADD COLUMN     "cuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "company_location_cuid_key" ON "company_location"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "roles_cuid_key" ON "roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "shift_cuid_key" ON "shift"("cuid");
