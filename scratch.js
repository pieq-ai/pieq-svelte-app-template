import { db } from './src/lib/server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;
  const payrolls = await db.payroll.findMany({ take: 3 });
  console.log("Sample Payrolls:", JSON.stringify(payrolls, replacer, 2));

  const systemRoles = await db.systemRoles.findMany();
  console.log("System Roles:", JSON.stringify(systemRoles, replacer, 2));
}

main().catch(console.error);
