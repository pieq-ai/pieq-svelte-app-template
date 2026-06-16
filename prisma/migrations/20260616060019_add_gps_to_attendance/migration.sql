-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "check_in_gps_accuracy" DOUBLE PRECISION,
ADD COLUMN     "check_in_latitude" DOUBLE PRECISION,
ADD COLUMN     "check_in_longitude" DOUBLE PRECISION,
ADD COLUMN     "check_out_gps_accuracy" DOUBLE PRECISION,
ADD COLUMN     "check_out_latitude" DOUBLE PRECISION,
ADD COLUMN     "check_out_longitude" DOUBLE PRECISION;
