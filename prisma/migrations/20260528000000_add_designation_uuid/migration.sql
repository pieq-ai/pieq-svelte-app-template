ALTER TABLE "designation" ADD COLUMN "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "designation_uuid_key" ON "designation"("uuid");
