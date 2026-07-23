-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "entity_name" VARCHAR(100) NOT NULL,
    "entity_cuid" TEXT NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "field_name" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "performed_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_cuid_key" ON "audit_logs"("cuid");

-- CreateIndex
CREATE INDEX "audit_logs_entity_name_entity_cuid_idx" ON "audit_logs"("entity_name", "entity_cuid");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
