-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "type" VARCHAR(20) NOT NULL DEFAULT 'info',
    "payload" JSONB,
    "trigger_source" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "notification_cuid" TEXT NOT NULL,
    "employee_cuid" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_cuid_key" ON "notifications"("cuid");

-- CreateIndex
CREATE INDEX "notifications_cuid_idx" ON "notifications"("cuid");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_cuid_key" ON "notification_recipients"("cuid");

-- CreateIndex
CREATE INDEX "notification_recipients_employee_cuid_read_at_idx" ON "notification_recipients"("employee_cuid", "read_at");

-- CreateIndex
CREATE INDEX "notification_recipients_employee_cuid_archived_at_idx" ON "notification_recipients"("employee_cuid", "archived_at");

-- CreateIndex
CREATE INDEX "notification_recipients_notification_cuid_idx" ON "notification_recipients"("notification_cuid");

-- CreateIndex
CREATE INDEX "notification_recipients_cuid_idx" ON "notification_recipients"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_notification_cuid_employee_cuid_key" ON "notification_recipients"("notification_cuid", "employee_cuid");
