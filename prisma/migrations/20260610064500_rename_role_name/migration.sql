-- AlterTable
ALTER TABLE "roles" RENAME COLUMN "name" TO "role_name";

-- RenameIndex
ALTER INDEX "roles_name_key" RENAME TO "roles_role_name_key";
