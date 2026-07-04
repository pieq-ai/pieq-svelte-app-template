import { db } from '../src/lib/server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Department
  const dept = await db.department.upsert({
    where: { cuid: 'dept-1' },
    update: {},
    create: {
      cuid: 'dept-1',
      name: 'Engineering',
      status: true
    }
  });

  // 2. Seed Designation
  const desig = await db.designation.upsert({
    where: { cuid: 'desig-1' },
    update: {},
    create: {
      cuid: 'desig-1',
      name: 'Software Engineer',
      status: true
    }
  });

  // 3. Seed Location
  const loc = await db.companyLocation.upsert({
    where: { cuid: 'loc-1' },
    update: {},
    create: {
      cuid: 'loc-1',
      name: 'Head Office',
      address_line1: '123 Main St',
      city: 'Chennai',
      pin_code: '600001',
      state_cuid: 'state-1',
      country_cuid: 'country-1',
      timezone: 'Asia/Kolkata',
      status: true
    }
  });

  // 4. Seed Role
  const role = await db.role.upsert({
    where: { cuid: 'cmqyv2hh0000jt4uylmh6dltc' },
    update: {},
    create: {
      cuid: 'cmqyv2hh0000jt4uylmh6dltc',
      name: 'Developer',
      status: true
    }
  });

  // 5. Seed System Roles
  await db.systemRoles.upsert({
    where: { cuid: 'cmr0xxrgx0002iwuyqa2mujj9' },
    update: {},
    create: {
      cuid: 'cmr0xxrgx0002iwuyqa2mujj9',
      name: 'HR',
      status: true
    }
  });

  // 6. Seed Employees
  const emp1 = await db.employee.upsert({
    where: { cuid: 'cmqyv5ngf000nt4uyqeuwh2fh' },
    update: { is_deleted: false },
    create: {
      cuid: 'cmqyv5ngf000nt4uyqeuwh2fh',
      emp_code: 'EMP001',
      first_name: 'Sudharshan',
      last_name: 'Dhanasekar',
      dob: new Date('1995-05-15'),
      gender: 'Male',
      is_deleted: false
    }
  });

  const emp2 = await db.employee.upsert({
    where: { cuid: 'cmqyv1vln0004t4uyjy2aii27' },
    update: { is_deleted: false },
    create: {
      cuid: 'cmqyv1vln0004t4uyjy2aii27',
      emp_code: 'EMP002',
      first_name: 'Karthika',
      last_name: 'Selvakumar',
      dob: new Date('1994-08-20'),
      gender: 'Female',
      is_deleted: false
    }
  });

  // 7. Seed Employments
  await db.employment.upsert({
    where: { cuid: 'empl-1' },
    update: {
      reporting_manager_cuid: 'cmqyv1vln0004t4uyjy2aii27'
    },
    create: {
      cuid: 'empl-1',
      employee_cuid: 'cmqyv5ngf000nt4uyqeuwh2fh',
      department_cuid: 'dept-1',
      designation_cuid: 'desig-1',
      role_cuid: 'cmqyv2hh0000jt4uylmh6dltc',
      location_cuid: 'loc-1',
      reporting_manager_cuid: 'cmqyv1vln0004t4uyjy2aii27',
      employment_status: 'active',
      official_email: 'sudharshan.d@pieq.ai',
      date_of_joining: new Date('2025-01-01')
    }
  });

  await db.employment.upsert({
    where: { cuid: 'empl-2' },
    update: {
      reporting_manager_cuid: 'cmqyv5ngf000nt4uyqeuwh2fh'
    },
    create: {
      cuid: 'empl-2',
      employee_cuid: 'cmqyv1vln0004t4uyjy2aii27',
      department_cuid: 'dept-1',
      designation_cuid: 'desig-1',
      role_cuid: 'cmqyv2hh0000jt4uylmh6dltc',
      location_cuid: 'loc-1',
      reporting_manager_cuid: 'cmqyv5ngf000nt4uyqeuwh2fh',
      employment_status: 'active',
      official_email: 'karthika.s@pieq.ai',
      date_of_joining: new Date('2025-01-01')
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
