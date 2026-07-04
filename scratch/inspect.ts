import { db } from '../src/lib/server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const replacer = (key: string, value: any) => typeof value === 'bigint' ? value.toString() : value;

  console.log("\n=== DEPARTMENTS ===");
  const depts = await db.department.findMany();
  console.log("Departments:", JSON.stringify(depts, replacer, 2));

  console.log("\n=== DESIGNATIONS ===");
  const desigs = await db.designation.findMany();
  console.log("Designations:", JSON.stringify(desigs, replacer, 2));

  console.log("\n=== EMPLOYEE ===");
  const employees = await db.employee.findMany();
  console.log("Employees:", JSON.stringify(employees, replacer, 2));

  console.log("\n=== EMPLOYMENT ===");
  const employments = await db.employment.findMany();
  console.log("Employments:", JSON.stringify(employments, replacer, 2));

  console.log("\n=== SETTINGS ===");
  const settings = await db.settings.findMany();
  console.log("Settings rows:", JSON.stringify(settings, replacer, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
