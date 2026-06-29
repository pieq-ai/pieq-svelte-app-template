import pkg from './src/lib/generated/prisma/client/index.js';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const employments = await prisma.employment.findMany();
  console.log("Total Employments:", employments.length);
  console.log("Employments with reporting manager:", employments.filter(e => e.reporting_manager_cuid).length);
  console.log("Distinct reporting managers:", [...new Set(employments.map(e => e.reporting_manager_cuid).filter(Boolean))]);
  
  const employees = await prisma.employee.findMany();
  console.log("Total Employees:", employees.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
