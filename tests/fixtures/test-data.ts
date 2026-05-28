import { prisma, generateRandomString } from '../utils/db-helper';

export async function createTestDepartment() {
  const name = `Dept ${generateRandomString(6)}`;
  return await prisma.department.create({
    data: {
      dept_name: name,
      status: true
    }
  });
}

export async function createTestDesignation() {
  const name = `Desig ${generateRandomString(6)}`;
  return await prisma.designation.create({
    data: {
      designation_name: name,
      status: true
    }
  });
}

export async function createTestBloodGroup() {
  const name = `O+ ${generateRandomString(2)}`;
  return await prisma.bloodGroup.create({
    data: {
      blood_group_name: name
    }
  });
}

export async function createTestNationality() {
  const name = `Nation ${generateRandomString(5)}`;
  return await prisma.nationality.create({
    data: {
      nationality_name: name,
      status: true
    }
  });
}

export async function createTestRelationType() {
  const name = `Rel ${generateRandomString(5)}`;
  return await prisma.relationType.create({
    data: {
      relation_name: name,
      status: true
    }
  });
}

export async function createTestEmployee() {
  const dept = await createTestDepartment();
  const desig = await createTestDesignation();
  const bg = await createTestBloodGroup();
  const nat = await createTestNationality();
  
  const empCode = `EMP-${generateRandomString(4).toUpperCase()}`;
  
  return await prisma.employee.create({
    data: {
      emp_code: empCode,
      first_name: 'Test',
      last_name: 'User',
      dob: new Date('1990-01-01'),
      gender: 'Male',
      blood_group_cuid2: bg.cuid2,
      marital_status: 'single',
      nationality_cuid2: nat.cuid2,
      mobile_no: `99${generateRandomString(8).replace(/[^0-9]/g, '0').padEnd(8, '0')}`,
      personal_email: `test.${generateRandomString(5)}@example.com`,
      aadhar_no: `1234${generateRandomString(8).replace(/[^0-9]/g, '0').padEnd(8, '0')}`,
      pan_no: `ABCDE${generateRandomString(4).replace(/[^0-9]/g, '0').padEnd(4, '0')}F`,
    }
  });
}

export async function setupBaseMasterData() {
  return {
    bloodGroup: await createTestBloodGroup(),
    nationality: await createTestNationality(),
    department: await createTestDepartment(),
    designation: await createTestDesignation(),
    relationType: await createTestRelationType()
  };
}
