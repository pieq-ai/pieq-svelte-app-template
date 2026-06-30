import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import { KeycloakService } from '$lib/server/services/keycloak/keycloak.service.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';
import * as addressDao from '$lib/server/dao/address.dao.js';

const keycloakService = new KeycloakService();
import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as educationDao from '$lib/server/dao/education.dao.js';
import * as experienceDao from '$lib/server/dao/experience.dao.js';
import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as languageDao from '$lib/server/dao/language.dao.js';
import { personalSchema } from '$lib/schemas/employee.schema.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreateEmployeeDto {
    emp_code: string;
    first_name: string;
    last_name: string;
    father_name?: string | null;
    dob?: string | Date | null;
    gender?: string | null;
    marital_status?: string | null;
    blood_group_cuid?: string | null;
    nationality_cuid?: string | null;
    mobile_no?: string | null;
    personal_email?: string | null;
    aadhar_no?: string | null;
    pan_no?: string | null;
    uan_no?: string | null;
    esi_no?: string | null;
    pf_account_no?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_no?: string | null;
    relation_cuid?: string | null;
    remarks?: string | null;
    created_by?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
    updated_by?: string;
}

function toPublicEmployee(emp: any) {
    if (!emp) return null;
    const { id, created_at, updated_at, is_deleted, deleted_at, ...rest } = emp;
    return rest;
}

export async function getEmployees() {
    const employees = await employeeDao.list();
    const employments = await employmentDao.list();
    const empMap = new Map(employments.map(e => [e.employee_cuid, e]));
    return employees.map(emp => {
        const publicEmp = toPublicEmployee(emp);
        if (publicEmp) {
            const empl = empMap.get(emp.cuid);
            publicEmp.date_of_joining = empl?.date_of_joining || null;
            publicEmp.relieving_date = empl?.relieving_date || null;
        }
        return publicEmp;
    });
}

export async function getEmployeeByCuid2(cuid: string) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const emp = await employeeDao.findByCuid2(cuid);
    if (!emp) throw new Error(`Employee with CUID2 "${cuid}" not found`);
    const publicEmp = toPublicEmployee(emp);
    if (publicEmp) {
        const empl = await employmentDao.findByEmployeeCuid(cuid);
        publicEmp.date_of_joining = empl?.date_of_joining || null;
        publicEmp.relieving_date = empl?.relieving_date || null;
    }
    return publicEmp;
}

export async function generateNextEmployeeCode(): Promise<string> {
    const latest = await employeeDao.getLatestEmployeeCode();
    if (!latest) {
        return 'PQ001';
    }
    const match = latest.match(/^PQ(\d+)$/);
    if (!match) {
        return 'PQ001';
    }
    const nextNumber = parseInt(match[1], 10) + 1;
    return `PQ${nextNumber.toString().padStart(3, '0')}`;
}

export async function createEmployee(dto: CreateEmployeeDto) {
    const validated = personalSchema.parse(dto);
    
    const {
        first_name,
        last_name,
        father_name,
        personal_email,
        mobile_no,
        emergency_contact_name,
        emergency_contact_no,
        pan_no,
        aadhar_no,
        uan_no,
        esi_no,
        pf_account_no,
        dob,
        remarks,
        ...restDto
    } = validated;

    if (personal_email) {
        const existingEmail = await employeeDao.findByEmail(personal_email);
        if (existingEmail) {
            throw new ValidationError("personal_email", "This email address is already assigned to another employee.");
        }
    }

    if (mobile_no) {
        const existingMobile = await employeeDao.findByMobile(mobile_no);
        if (existingMobile) {
            throw new ValidationError("mobile_no", "Mobile number already exists.");
        }
    }

    const existingAadhar = aadhar_no ? await employeeDao.findByAadhar(aadhar_no) : null;
    if (existingAadhar) {
        throw new ValidationError("aadhar_no", "Aadhar number already exists.");
    }

    const existingPan = pan_no ? await employeeDao.findByPan(pan_no) : null;
    if (existingPan) {
        throw new ValidationError("pan_no", "PAN number already exists.");
    }

    const existingPf = pf_account_no ? await employeeDao.findByPfAccountNo(pf_account_no) : null;
    if (existingPf) {
        throw new ValidationError("pf_account_no", "This PF Account Number is already assigned to another employee.");
    }

    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
        const emp_code = await generateNextEmployeeCode();
        
        try {
            const result = await employeeDao.create({
                ...validated,
                created_by: dto.created_by,
                emp_code,
                profile_completion_status: 'pending'
            });
            return toPublicEmployee(result);
        } catch (error: any) {
            // Prisma code for unique constraint violation
            if (error.code === 'P2002' && error.meta?.target?.includes('emp_code')) {
                retries++;
                if (retries >= maxRetries) {
                    throw new ValidationError("emp_code", `Unable to generate a unique employee code after ${maxRetries} attempts. Please try again.`);
                }
                // wait a tiny bit to mitigate tight loop collisions
                await new Promise(res => setTimeout(res, 50 * retries));
                continue;
            }
            throw error;
        }
    }
}

export async function updateEmployee(cuid: string, dto: UpdateEmployeeDto) {
    if (!cuid) throw new Error("Employee CUID is required");
    const emp = await employeeDao.findByCuid2(cuid);
    if (!emp) throw new Error(`Employee with CUID "${cuid}" not found`);

    const validated = personalSchema.partial().parse(dto);
    
    const {
        first_name,
        last_name,
        father_name,
        personal_email,
        mobile_no,
        emergency_contact_name,
        emergency_contact_no,
        pan_no,
        aadhar_no,
        uan_no,
        esi_no,
        pf_account_no,
        dob,
        remarks,
        ...restDto
    } = validated;

    if (personal_email && personal_email !== emp.personal_email) {
        const existingEmail = await employeeDao.findByEmail(personal_email);
        if (existingEmail && existingEmail.cuid !== cuid) {
            throw new ValidationError("personal_email", "This email address is already assigned to another employee.");
        }
    }

    if (mobile_no && mobile_no !== emp.mobile_no) {
        const existingMobile = await employeeDao.findByMobile(mobile_no);
        if (existingMobile && existingMobile.cuid !== cuid) {
            throw new ValidationError("mobile_no", "Mobile number already exists.");
        }
    }

    if (aadhar_no && aadhar_no !== emp.aadhar_no) {
        const existingAadhar = await employeeDao.findByAadhar(aadhar_no);
        if (existingAadhar && existingAadhar.cuid !== cuid) {
            throw new ValidationError("aadhar_no", "Aadhar number already exists.");
        }
    }

    if (pan_no && pan_no !== emp.pan_no) {
        const existingPan = await employeeDao.findByPan(pan_no);
        if (existingPan && existingPan.cuid !== cuid) {
            throw new ValidationError("pan_no", "PAN number already exists.");
        }
    }

    if (pf_account_no && pf_account_no !== emp.pf_account_no) {
        const existingPf = await employeeDao.findByPfAccountNo(pf_account_no);
        if (existingPf && existingPf.cuid !== cuid) {
            throw new ValidationError("pf_account_no", "This PF Account Number is already assigned to another employee.");
        }
    }

    return toPublicEmployee(await employeeDao.update(cuid, {
        ...validated,
        updated_by: dto.updated_by
    } as employeeDao.UpdateEmployeeInput));
}

export async function isProfileComplete(employee_cuid: string): Promise<boolean> {
    if (!employee_cuid) return false;
    
    try {
        const [
            emp,
            employment,
            addresses,
            banks
        ] = await Promise.all([
            employeeDao.findByCuid2(employee_cuid),
            employmentDao.findByEmployeeCuid(employee_cuid),
            addressDao.findByEmployeeCuid(employee_cuid),
            bankDetailDao.findByEmployeeCuid(employee_cuid)
        ]);

        if (!emp) return false;

        return (
            employment !== null &&
            addresses.length > 0 &&
            banks.length > 0
        );
    } catch (error) {
        console.error('Failed to validate if profile is complete', error);
        return false;
    }
}

export async function checkAndSetProfileCompletionStatus(employee_cuid: string) {
    if (!employee_cuid) return;

    try {
        const emp = await employeeDao.findByCuid2(employee_cuid);
        if (!emp) return;

        // If already completed, do nothing
        if (emp.profile_completion_status === 'completed') return;

        const profileReady = await isProfileComplete(employee_cuid);

        if (profileReady) {
            console.log(`Employee onboarding complete.\nWaiting for Keycloak provisioning.`);
            
            const employment = await employmentDao.findByEmployeeCuid(employee_cuid);
            if (!employment) {
                throw new Error("Cannot provision user: employment record is missing.");
            }
            
            if (!employment?.official_email) {
                throw new Error("Cannot provision user: official_email is missing.");
            }
            if (!employment?.system_role_cuid) {
                throw new Error("Cannot provision user: system_role_cuid is missing.");
            }

            let keycloakSub = employment.keycloak_sub;

            console.log(`[KC-01] ========== KEYCLOAK ONBOARDING START ==========
Employee CUID: ${employee_cuid}
Official Email: ${employment.official_email}
Existing keycloak_sub: ${keycloakSub || 'None'}
profile_completion_status: ${emp.profile_completion_status}`);

            if (!keycloakSub) {
                // Step 1: Create User
                console.log(`[KC-02] Provisioning Started: Creating Keycloak User
employee_cuid: ${employee_cuid}
username: ${employment.official_email}
official email: ${employment.official_email}
keycloak_sub exists: false`);
                const result = await keycloakService.createUser({
                    username: employment.official_email,
                    email: employment.official_email,
                    firstName: emp.first_name,
                    lastName: emp.last_name,
                    enabled: true
                });
                keycloakSub = result.keycloakSub;

                console.log(`[KC-03] Keycloak User Created Successfully. Returned UUID: ${keycloakSub}`);

                // Step 2: Immediately persist keycloak_sub
                console.log('[KC-04] Persisting keycloak_sub...');
                await employmentDao.upsert(employee_cuid, {
                    ...employment,
                    keycloak_sub: keycloakSub
                } as employmentDao.UpsertEmploymentInput);
                console.log('[KC-05] keycloak_sub stored successfully');
            } else {
                console.log(`Resuming provisioning for existing Keycloak user: ${keycloakSub}`);
            }

            // Step 3: Assign Realm Role
            console.log('[KC-06] Fetching HRMS System Role...');
            const systemRole = await systemRoleDao.findByCuid2(employment.system_role_cuid);
            if (!systemRole) {
                throw new Error(`Cannot provision user: SystemRole with CUID ${employment.system_role_cuid} not found`);
            }
            const keycloakRole = await keycloakService.getRealmRole(systemRole.name);
            console.log(`[KC-07] Fetched HRMS System Role.
HRMS role CUID: ${systemRole.cuid}
HRMS role name: ${systemRole.name}
mapped Keycloak realm role: ${keycloakRole?.name} (${keycloakRole?.id})`);

            console.log(`[KC-08] Calling assignRealmRole()
Keycloak UUID: ${keycloakSub}
Realm Role: ${keycloakRole.name}`);
            await keycloakService.assignRealmRole(keycloakSub, keycloakRole);
            console.log('[KC-09] assignRealmRole() completed successfully');

            // Step 4: Trigger UPDATE_PASSWORD email
            const requiredActions = ['UPDATE_PASSWORD'];
            console.log(`[KC-10] Calling triggerRequiredActions()
Keycloak UUID: ${keycloakSub}
Actions array: ${JSON.stringify(requiredActions)}
request payload: ${JSON.stringify(requiredActions)}`);
            try {
                await keycloakService.triggerRequiredActions(keycloakSub, requiredActions);
                console.log('[KC-11] triggerRequiredActions() completed successfully');
            } catch (emailError: any) {
                console.error(`[KC-ERROR-11] Error in triggerRequiredActions()
Complete error object: ${JSON.stringify(emailError, Object.getOwnPropertyNames(emailError))}
Stack trace: ${emailError.stack}
Response status: ${emailError.status || emailError.response?.status || 'N/A'}
Response body: ${JSON.stringify(emailError.details || emailError.response?.data || 'N/A')}`);
            }

            // Step 5: Mark employee completed
            console.log('[KC-12] Updating profile_completion_status -> completed');
            await employeeDao.update(employee_cuid, { profile_completion_status: 'completed' } as employeeDao.UpdateEmployeeInput);
            console.log(`[KC-13] Employee marked completed\n========== KEYCLOAK ONBOARDING END ==========`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to process profile completion transition', error);
        throw error;
    }
}

export async function deleteEmployee(cuid: string) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const existing = await employeeDao.findByCuid2(cuid);
    if (!existing) throw new Error(`Employee with CUID2 "${cuid}" not found`);
    return toPublicEmployee(await employeeDao.remove(cuid));
}

export async function getMinimalEmployeesForAttendance() {
    const employees = await employeeDao.list();
    const employments = await employmentDao.list();
    const empMap = new Map(employments.map(e => [e.employee_cuid, e]));
    return employees.map(emp => {
        const empl = empMap.get(emp.cuid);
        return {
            cuid: emp.cuid,
            emp_code: emp.emp_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            date_of_joining: empl?.date_of_joining || null,
            relieving_date: empl?.relieving_date || null
        };
    });
}
