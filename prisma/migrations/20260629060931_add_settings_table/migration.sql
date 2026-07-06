-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "payroll_cutoff" INTEGER DEFAULT 25,
    "name" VARCHAR(100) DEFAULT 'payroll_cutoff',
    "configuration" JSONB DEFAULT '{"payroll_cut_off_date": 25}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_cuid_key" ON "settings"("cuid");
