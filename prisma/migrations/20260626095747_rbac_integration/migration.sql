-- AlterTable
ALTER TABLE "employments" ADD COLUMN     "keycloak_sub" TEXT,
ADD COLUMN     "system_role_cuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employments_keycloak_sub_key" ON "employments"("keycloak_sub");
