-- CreateTable
CREATE TABLE "system_roles" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "system_role_cuid" TEXT NOT NULL,
    "permission_cuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" VARCHAR(100),

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_cuid_key" ON "system_roles"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_name_key" ON "system_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_cuid_key" ON "permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_cuid_key" ON "role_permissions"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_system_role_cuid_permission_cuid_key" ON "role_permissions"("system_role_cuid", "permission_cuid");
