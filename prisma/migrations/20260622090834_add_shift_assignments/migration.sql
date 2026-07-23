-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "employee_cuid" VARCHAR(100) NOT NULL,
    "shift_cuid" VARCHAR(100) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_cuid_key" ON "shift_assignments"("cuid");

-- CreateIndex
CREATE INDEX "shift_assignments_employee_cuid_idx" ON "shift_assignments"("employee_cuid");

-- CreateIndex
CREATE INDEX "shift_assignments_shift_cuid_idx" ON "shift_assignments"("shift_cuid");
