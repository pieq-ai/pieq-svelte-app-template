import { db } from '../src/lib/server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Find Karthika and Sudharshan
  const karthika = await db.employee.findFirst({ where: { first_name: 'Karthika' } });
  const sudharshan = await db.employee.findFirst({ where: { first_name: 'Sudharshan' } });

  if (karthika && sudharshan) {
    console.log(`Found Karthika (${karthika.cuid}) and Sudharshan (${sudharshan.cuid})`);

    // Set Sudharshan's reporting manager to Karthika
    const sudharshanEmployment = await db.employment.findFirst({ where: { employee_cuid: sudharshan.cuid } });
    if (sudharshanEmployment) {
      await db.employment.update({
        where: { cuid: sudharshanEmployment.cuid },
        data: { reporting_manager_cuid: karthika.cuid }
      });
      console.log("Updated Sudharshan's reporting manager to Karthika");
    }

    // Set Karthika's reporting manager to Sudharshan
    const karthikaEmployment = await db.employment.findFirst({ where: { employee_cuid: karthika.cuid } });
    if (karthikaEmployment) {
      await db.employment.update({
        where: { cuid: karthikaEmployment.cuid },
        data: { reporting_manager_cuid: sudharshan.cuid }
      });
      console.log("Updated Karthika's reporting manager to Sudharshan");
    }
  } else {
    console.log("Karthika or Sudharshan not found.");
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
