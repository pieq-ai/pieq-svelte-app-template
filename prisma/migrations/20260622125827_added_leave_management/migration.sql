-- AlterTable
ALTER TABLE "company_locations" ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "leave_type_cuid" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated_days" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "used_days" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "remaining_days" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "carried_forward_days" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "leave_type_cuid" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" DECIMAL(8,2) NOT NULL,
    "is_half_day" BOOLEAN NOT NULL DEFAULT false,
    "half_day_session" VARCHAR(10),
    "reason" TEXT,
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "file_size" INTEGER,
    "document_data" BYTEA,
    "request_status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "days_from_primary" DECIMAL(8,2),
    "days_from_lwp" DECIMAL(8,2),
    "days_from_lop" DECIMAL(8,2),
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMPTZ(3),
    "withdrawn_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_cuid_key" ON "leave_balances"("cuid");

-- CreateIndex
CREATE INDEX "leave_balances_employee_cuid_idx" ON "leave_balances"("employee_cuid");

-- CreateIndex
CREATE INDEX "leave_balances_leave_type_cuid_idx" ON "leave_balances"("leave_type_cuid");

-- CreateIndex
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_cuid_leave_type_cuid_year_key" ON "leave_balances"("employee_cuid", "leave_type_cuid", "year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_requests_cuid_key" ON "leave_requests"("cuid");

-- CreateIndex
CREATE INDEX "leave_requests_employee_cuid_idx" ON "leave_requests"("employee_cuid");

-- CreateIndex
CREATE INDEX "leave_requests_leave_type_cuid_idx" ON "leave_requests"("leave_type_cuid");

-- CreateIndex
CREATE INDEX "leave_requests_request_status_idx" ON "leave_requests"("request_status");
