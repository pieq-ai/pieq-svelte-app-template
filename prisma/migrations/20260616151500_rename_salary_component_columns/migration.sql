-- Rename Columns in salary_components
ALTER TABLE "salary_components" RENAME COLUMN "component_name" TO "name";
ALTER TABLE "salary_components" RENAME COLUMN "component_type" TO "type";

-- Rename Indexes/Constraints
ALTER INDEX "salary_components_component_name_key" RENAME TO "salary_components_name_key";
