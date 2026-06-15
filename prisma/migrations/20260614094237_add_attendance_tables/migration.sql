-- CreateTable
CREATE TABLE "attendance_records" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIMESTAMPTZ(3),
    "check_out_time" TIMESTAMPTZ(3),
    "work_duration_minutes" INTEGER,
    "attendance_status" VARCHAR(20) NOT NULL,
    "attendance_source_cuid" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_cuid_key" ON "attendance_records"("cuid");

-- CreateIndex
CREATE INDEX "attendance_records_employee_cuid_idx" ON "attendance_records"("employee_cuid");

-- CreateIndex
CREATE INDEX "attendance_records_attendance_date_idx" ON "attendance_records"("attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employee_cuid_attendance_date_key" ON "attendance_records"("employee_cuid", "attendance_date");
