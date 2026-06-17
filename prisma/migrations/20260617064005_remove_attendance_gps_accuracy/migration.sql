/*
  Warnings:

  - You are about to drop the column `check_in_gps_accuracy` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_gps_accuracy` on the `attendance_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "check_in_gps_accuracy",
DROP COLUMN "check_out_gps_accuracy";
