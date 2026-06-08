-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_uuid_key" ON "employees"("uuid");
