/*
  Warnings:

  - You are about to drop the column `is_active` on the `salary_components` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `salary_structures` table. All the data in the column will be lost.
  - Added the required column `component_name_snapshot` to the `salary_structure_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "salary_components" DROP COLUMN "is_active",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "salary_structure_items" ADD COLUMN     "component_name_snapshot" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "salary_structures" DROP COLUMN "is_active",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
