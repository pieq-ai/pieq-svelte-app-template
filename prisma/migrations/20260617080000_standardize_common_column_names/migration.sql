-- AlterTable (Rename columns in leave_types)
ALTER TABLE "leave_types" RENAME COLUMN "leave_name" TO "name";
ALTER TABLE "leave_types" RENAME COLUMN "leave_code" TO "code";

-- RenameIndex (Rename indexes in leave_types)
ALTER INDEX "leave_types_leave_name_key" RENAME TO "leave_types_name_key";
ALTER INDEX "leave_types_leave_code_key" RENAME TO "leave_types_code_key";

-- AlterTable (Rename columns in holiday_calendars)
ALTER TABLE "holiday_calendars" RENAME COLUMN "holiday_name" TO "name";
ALTER TABLE "holiday_calendars" RENAME COLUMN "holiday_date" TO "date";
ALTER TABLE "holiday_calendars" RENAME COLUMN "holiday_type" TO "type";

-- RenameIndex (Rename index in holiday_calendars)
ALTER INDEX "holiday_calendars_holiday_name_holiday_date_key" RENAME TO "holiday_calendars_name_date_key";

-- AlterTable (Rename columns in attendance_records)
ALTER TABLE "attendance_records" RENAME COLUMN "attendance_date" TO "date";
ALTER TABLE "attendance_records" RENAME COLUMN "attendance_status" TO "status";

-- RenameIndex (Rename indexes in attendance_records)
ALTER INDEX "attendance_records_attendance_date_idx" RENAME TO "attendance_records_date_idx";
ALTER INDEX "attendance_records_employee_cuid_attendance_date_key" RENAME TO "attendance_records_employee_cuid_date_key";
