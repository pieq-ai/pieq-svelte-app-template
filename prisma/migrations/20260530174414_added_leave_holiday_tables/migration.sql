-- CreateTable
CREATE TABLE "leave_types" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_name" VARCHAR(100) NOT NULL,
    "leave_code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_type_cuid" TEXT NOT NULL,
    "annual_quota" DECIMAL(5,1) NOT NULL,
    "max_per_month" DECIMAL(4,1),
    "carry_forward_allowed" BOOLEAN NOT NULL DEFAULT false,
    "max_carry_forward_days" DECIMAL(4,1),
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "min_service_days" INTEGER NOT NULL DEFAULT 0,
    "allow_half_day" BOOLEAN NOT NULL DEFAULT false,
    "gender_specific" BOOLEAN NOT NULL DEFAULT false,
    "applicable_gender" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deactivated_by_leave_type" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendars" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "holiday_name" VARCHAR(200) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "holiday_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_types" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employment_name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policy_employment_types" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "leave_policy_cuid" TEXT NOT NULL,
    "employment_type_cuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_policy_employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_cuid_key" ON "leave_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_name_key" ON "leave_types"("leave_name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_code_key" ON "leave_types"("leave_code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_cuid_key" ON "leave_policies"("cuid");

-- CreateIndex
CREATE INDEX "leave_policies_leave_type_cuid_idx" ON "leave_policies"("leave_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendars_cuid_key" ON "holiday_calendars"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendars_holiday_name_holiday_date_key" ON "holiday_calendars"("holiday_name", "holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_cuid_key" ON "employment_types"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_employment_name_key" ON "employment_types"("employment_name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_types_cuid_key" ON "leave_policy_employment_types"("cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_types_leave_policy_cuid_idx" ON "leave_policy_employment_types"("leave_policy_cuid");

-- CreateIndex
CREATE INDEX "leave_policy_employment_types_employment_type_cuid_idx" ON "leave_policy_employment_types"("employment_type_cuid");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policy_employment_types_leave_policy_cuid_employment__key" ON "leave_policy_employment_types"("leave_policy_cuid", "employment_type_cuid");
