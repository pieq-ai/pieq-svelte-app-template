/*
  Warnings:

  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "role";

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_uuid_key" ON "roles"("uuid");
