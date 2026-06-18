/*
  Warnings:

  - You are about to alter the column `aadhar_no` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `VarChar(12)`.
  - You are about to alter the column `pan_no` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `VarChar(10)`.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "aadhar_no" SET DATA TYPE VARCHAR(12),
ALTER COLUMN "pan_no" SET DATA TYPE VARCHAR(10);
