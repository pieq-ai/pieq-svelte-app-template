import { PrismaClient } from '../src/lib/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pkgPg from 'pg';
const { Pool } = pkgPg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seeding...');

  // 1. Clean existing records
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "attendance_records", "leave_requests", "leave_balances", "leave_policy_employment_types", "leave_policies", "leave_types", "employments", "employees", "departments", "designations", "employment_types" CASCADE;');

  // 2. Seed Departments
  const deptHR = await prisma.department.create({
    data: { name: 'Human Resources', status: true }
  });
  const deptEng = await prisma.department.create({
    data: { name: 'Engineering', status: true }
  });

  // 3. Seed Designations
  const desEng = await prisma.designation.create({
    data: { name: 'Software Engineer', status: true }
  });
  const desHR = await prisma.designation.create({
    data: { name: 'HR Manager', status: true }
  });

  // 4. Seed Employment Types
  const empPermanent = await prisma.employmentType.create({
    data: { name: 'Permanent', status: true }
  });
  const empContractor = await prisma.employmentType.create({
    data: { name: 'Contractor', status: true }
  });

  // 5. Seed Employees
  // John Doe: Male, joined >365 days ago (e.g. 2024-01-15)
  // Jane Smith: Female, joined 90 days ago (e.g. 2026-03-14)
  // Bob Johnson: Male, joined 30 days ago (e.g. 2026-05-13)
  const empJohn = await prisma.employee.create({
    data: {
      emp_code: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      dob: new Date('1985-05-15'),
      gender: 'Male',
      marital_status: 'Married',
      remarks: 'Senior Software Engineer',
      profile_completion_status: 'completed'
    }
  });

  const empJane = await prisma.employee.create({
    data: {
      emp_code: 'EMP002',
      first_name: 'Jane',
      last_name: 'Smith',
      dob: new Date('1990-08-20'),
      gender: 'Female',
      marital_status: 'Single',
      remarks: 'HR Specialist',
      profile_completion_status: 'completed'
    }
  });

  const empBob = await prisma.employee.create({
    data: {
      emp_code: 'EMP003',
      first_name: 'Bob',
      last_name: 'Johnson',
      dob: new Date('1992-11-10'),
      gender: 'Male',
      marital_status: 'Single',
      remarks: 'Junior Software Engineer',
      profile_completion_status: 'completed'
    }
  });

  // 6. Seed Employment
  // John's official email is karthika.s@pieq.ai so Keycloak session will match him
  // John reports to himself so he can see his own leave requests in Pending Approvals (dev/testing convenience)
  await prisma.employment.create({
    data: {
      employee_cuid: empJohn.cuid,
      department_cuid: deptEng.cuid,
      designation_cuid: desEng.cuid,
      employment_type_cuid: empPermanent.cuid,
      employment_status: 'active',
      date_of_joining: new Date('2024-01-15'),
      official_email: 'karthika.s@pieq.ai',
      reporting_manager_cuid: empJohn.cuid  // Self-referential: John is his own manager for testing
    }
  });

  await prisma.employment.create({
    data: {
      employee_cuid: empJane.cuid,
      department_cuid: deptHR.cuid,
      designation_cuid: desHR.cuid,
      employment_type_cuid: empPermanent.cuid,
      employment_status: 'active',
      date_of_joining: new Date('2026-03-14'),
      official_email: 'jane.smith@pieq.ai',
      reporting_manager_cuid: empJohn.cuid
    }
  });

  await prisma.employment.create({
    data: {
      employee_cuid: empBob.cuid,
      department_cuid: deptEng.cuid,
      designation_cuid: desEng.cuid,
      employment_type_cuid: empPermanent.cuid,
      employment_status: 'active',
      date_of_joining: new Date('2026-05-13'),
      official_email: 'bob.johnson@pieq.ai',
      reporting_manager_cuid: empJohn.cuid
    }
  });

  // 7. Seed LeaveTypes
  const leaveTypes = [
    { name: 'Earned Leave', code: 'EL', isPaid: true, reqApproval: true },
    { name: 'Casual Leave', code: 'CL', isPaid: true, reqApproval: true },
    { name: 'Sick Leave', code: 'SL', isPaid: true, reqApproval: true },
    { name: 'Maternity Leave', code: 'ML', isPaid: true, reqApproval: true },
    { name: 'Paternity Leave', code: 'PL', isPaid: true, reqApproval: true },
    { name: 'Leave Without Pay', code: 'LWP', isPaid: false, reqApproval: true }
  ];

  const typeRecords = {};
  for (const lt of leaveTypes) {
    typeRecords[lt.code] = await prisma.leaveType.create({
      data: {
        leave_name: lt.name,
        leave_code: lt.code,
        is_paid: lt.isPaid,
        requires_approval: lt.reqApproval,
        status: true
      }
    });
  }

  // 8. Seed LeavePolicies
  const policies = [
    {
      code: 'EL',
      limit: 12.0,
      maxPerMonth: null,
      cfAllowed: true,
      maxCf: 6.0,
      docReq: false,
      docReqAfter: null,
      minService: 365,
      allowHalf: false,
      genderSpecific: false,
      gender: null
    },
    {
      code: 'CL',
      limit: 6.0,
      maxPerMonth: 0.5,
      cfAllowed: true,
      maxCf: null,
      docReq: false,
      docReqAfter: null,
      minService: 0,
      allowHalf: true,
      genderSpecific: false,
      gender: null
    },
    {
      code: 'SL',
      limit: 6.0,
      maxPerMonth: 0.5,
      cfAllowed: true,
      maxCf: null,
      docReq: true,
      docReqAfter: 3,
      minService: 0,
      allowHalf: true,
      genderSpecific: false,
      gender: null
    },
    {
      code: 'ML',
      limit: 180.0,
      maxPerMonth: null,
      cfAllowed: false,
      maxCf: null,
      docReq: true,
      docReqAfter: null,
      minService: 80,
      allowHalf: false,
      genderSpecific: true,
      gender: 'Female'
    },
    {
      code: 'PL',
      limit: 5.0,
      maxPerMonth: null,
      cfAllowed: false,
      maxCf: null,
      docReq: false,
      docReqAfter: null,
      minService: 0,
      allowHalf: false,
      genderSpecific: true,
      gender: 'Male'
    },
    {
      code: 'LWP',
      limit: 365.0,
      maxPerMonth: null,
      cfAllowed: false,
      maxCf: null,
      docReq: false,
      docReqAfter: null,
      minService: 0,
      allowHalf: false,
      genderSpecific: false,
      gender: null
    }
  ];

  const policyRecords = {};
  for (const p of policies) {
    const typeCuid = typeRecords[p.code].cuid;
    policyRecords[p.code] = await prisma.leavePolicy.create({
      data: {
        leave_type_cuid: typeCuid,
        annual_limit: p.limit,
        max_per_month: p.maxPerMonth,
        carry_forward_allowed: p.cfAllowed,
        max_carry_forward_days: p.maxCf,
        document_required: p.docReq,
        document_required_after_days: p.docReqAfter,
        min_service_days: p.minService,
        allow_half_day: p.allowHalf,
        gender_specific: p.genderSpecific,
        applicable_gender: p.gender,
        status: true
      }
    });

    // Map policies to Permanent employment type
    await prisma.leavePolicyEmploymentType.create({
      data: {
        leave_policy_cuid: policyRecords[p.code].cuid,
        employment_type_cuid: empPermanent.cuid
      }
    });
  }

  // 9. Seed LeaveBalances (Year 2026)
  // Let's seed initial leave balances for our three employees
  // For June 2026 (Month 6):
  // John Doe (Service days = 880):
  // - EL: allocated = 12, remaining = 12
  // - CL: accrued (allocated) = 3.0, remaining = 3.0
  // - SL: accrued (allocated) = 3.0, remaining = 3.0
  // - PL: allocated = 5.0, remaining = 5.0
  // - LWP: allocated = 365, remaining = 365
  const johnBalances = [
    { code: 'EL', alloc: 12.0, cf: 0 },
    { code: 'CL', alloc: 3.0, cf: 0 },
    { code: 'SL', alloc: 3.0, cf: 0 },
    { code: 'PL', alloc: 5.0, cf: 0 },
    { code: 'LWP', alloc: 365.0, cf: 0 }
  ];
  for (const jb of johnBalances) {
    await prisma.leaveBalance.create({
      data: {
        employee_cuid: empJohn.cuid,
        leave_type_cuid: typeRecords[jb.code].cuid,
        year: 2026,
        allocated_days: jb.alloc,
        used_days: 0.0,
        remaining_days: jb.alloc,
        carried_forward_days: jb.cf
      }
    });
  }

  // Jane Smith (Female, joined 90 days ago on March 14, 2026 - eligible for ML, CL, SL, LWP):
  // - CL: accrued (March, April, May, June = 4 months * 0.5) = 2.0
  // - SL: accrued = 2.0
  // - ML: eligible (>80 service days), allocated = 180, remaining = 180
  // - LWP: allocated = 365, remaining = 365
  const janeBalances = [
    { code: 'CL', alloc: 2.0, cf: 0 },
    { code: 'SL', alloc: 2.0, cf: 0 },
    { code: 'ML', alloc: 180.0, cf: 0 },
    { code: 'LWP', alloc: 365.0, cf: 0 }
  ];
  for (const jb of janeBalances) {
    await prisma.leaveBalance.create({
      data: {
        employee_cuid: empJane.cuid,
        leave_type_cuid: typeRecords[jb.code].cuid,
        year: 2026,
        allocated_days: jb.alloc,
        used_days: 0.0,
        remaining_days: jb.alloc,
        carried_forward_days: jb.cf
      }
    });
  }

  // Bob Johnson (Male, joined 30 days ago on May 13, 2026 - eligible for CL, SL, PL, LWP):
  // - CL: accrued (May, June = 2 months * 0.5) = 1.0
  // - SL: accrued = 1.0
  // - PL: eligible (no service constraint), allocated = 5.0, remaining = 5.0
  // - LWP: allocated = 365, remaining = 365
  const bobBalances = [
    { code: 'CL', alloc: 1.0, cf: 0 },
    { code: 'SL', alloc: 1.0, cf: 0 },
    { code: 'PL', alloc: 5.0, cf: 0 },
    { code: 'LWP', alloc: 365.0, cf: 0 }
  ];
  for (const jb of bobBalances) {
    await prisma.leaveBalance.create({
      data: {
        employee_cuid: empBob.cuid,
        leave_type_cuid: typeRecords[jb.code].cuid,
        year: 2026,
        allocated_days: jb.alloc,
        used_days: 0.0,
        remaining_days: jb.alloc,
        carried_forward_days: jb.cf
      }
    });
  }

  // 10. Seed LeaveRequests
  // Jane Smith requests 2 days Casual Leave (CL) from June 22 to June 23, 2026
  await prisma.leaveRequest.create({
    data: {
      employee_cuid: empJane.cuid,
      leave_type_cuid: typeRecords['CL'].cuid,
      start_date: new Date('2026-06-22'),
      end_date: new Date('2026-06-23'),
      total_days: 2.0,
      is_half_day: false,
      reason: 'Doctor checkup and rest',
      request_status: 'pending',
      days_from_primary: 2.0,
      days_from_lwp: 0.0,
      created_by: empJane.emp_code
    }
  });

  // Bob Johnson requests 1 day Casual Leave (CL) on June 24, 2026
  await prisma.leaveRequest.create({
    data: {
      employee_cuid: empBob.cuid,
      leave_type_cuid: typeRecords['CL'].cuid,
      start_date: new Date('2026-06-24'),
      end_date: new Date('2026-06-24'),
      total_days: 1.0,
      is_half_day: false,
      reason: 'Personal work in hometown',
      request_status: 'pending',
      days_from_primary: 1.0,
      days_from_lwp: 0.0,
      created_by: empBob.emp_code
    }
  });

  // Bob Johnson already has attendance record as Present on June 24, 2026 (conflict)
  await prisma.attendanceRecord.create({
    data: {
      employee_cuid: empBob.cuid,
      attendance_date: new Date('2026-06-24'),
      attendance_status: 'Present',
      created_by: 'system',
      updated_by: 'system'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
