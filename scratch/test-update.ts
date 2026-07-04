import { setPayrollCutoffDay } from '../src/lib/server/services/leave.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await setPayrollCutoffDay(15);
  console.log("Success!");
}
run().catch(console.error);
