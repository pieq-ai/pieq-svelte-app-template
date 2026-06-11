-- Rename master table columns to "name"
ALTER TABLE "salary_components" RENAME COLUMN "component_name" TO "name";
ALTER TABLE "system_roles" RENAME COLUMN "system_role_name" TO "name";
ALTER TABLE "departments" RENAME COLUMN "dept_name" TO "name";
ALTER TABLE "blood_groups" RENAME COLUMN "blood_group_name" TO "name";
ALTER TABLE "designations" RENAME COLUMN "designation_name" TO "name";
ALTER TABLE "pay_grades" RENAME COLUMN "paygrade_name" TO "name";
ALTER TABLE "nationalities" RENAME COLUMN "nationality_name" TO "name";
ALTER TABLE "employment_types" RENAME COLUMN "employment_name" TO "name";
ALTER TABLE "relation_types" RENAME COLUMN "relation_name" TO "name";
ALTER TABLE "document_types" RENAME COLUMN "document_type_name" TO "name";
ALTER TABLE "states" RENAME COLUMN "state_name" TO "name";
ALTER TABLE "countries" RENAME COLUMN "country_name" TO "name";
ALTER TABLE "skills" RENAME COLUMN "skills_name" TO "name";
ALTER TABLE "attendance_sources" RENAME COLUMN "attendance_source_name" TO "name";
ALTER TABLE "languages" RENAME COLUMN "languages_name" TO "name";
ALTER TABLE "roles" RENAME COLUMN "role_name" TO "name";
ALTER TABLE "company_locations" RENAME COLUMN "location_name" TO "name";
