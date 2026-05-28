/*
  Warnings:

  - Made the column `cuid` on table `company_location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cuid` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cuid` on table `shift` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "company_location" ALTER COLUMN "cuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "cuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "shift" ALTER COLUMN "cuid" SET NOT NULL;
