-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "payroll_cutoff" INTEGER NOT NULL DEFAULT 25,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_cuid_key" ON "settings"("cuid");
