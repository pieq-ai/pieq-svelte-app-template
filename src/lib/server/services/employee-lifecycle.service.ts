import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as addressDao from '$lib/server/dao/address.dao.js';
import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as educationDao from '$lib/server/dao/education.dao.js';
import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as languageDao from '$lib/server/dao/language.dao.js';
import * as documentDao from '$lib/server/dao/document.dao.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';
import { KeycloakService } from '$lib/server/services/keycloak/keycloak.service.js';

const keycloakService = new KeycloakService();

/**
 * Validates if the employee meets the minimum requirements for IAM provisioning.
 * Mandatory: Employee, Employment, Bank Details.
 */
export async function isEmployeeReadyForProvisioning(employee_cuid: string): Promise<boolean> {
    if (!employee_cuid) return false;
    try {
        const [emp, employment, banks] = await Promise.all([
            employeeDao.findByCuid2(employee_cuid),
            employmentDao.findByEmployeeCuid(employee_cuid),
            bankDetailDao.findByEmployeeCuid(employee_cuid)
        ]);

        return (
            emp !== null &&
            employment !== null &&
            banks.length > 0
        );
    } catch (error) {
        console.error('Failed to validate provisioning readiness', error);
        return false;
    }
}

/**
 * Validates if the employee has completed all mandatory profile sections.
 * Mandatory: Employee, Employment, Bank, Address, Education, Skills, Languages, Documents.
 * Optional: Experience.
 */
export async function isEmployeeProfileComplete(employee_cuid: string): Promise<boolean> {
    if (!employee_cuid) return false;
    try {
        const [
            emp,
            employment,
            banks,
            addresses,
            educations,
            skills,
            languages,
            documents
        ] = await Promise.all([
            employeeDao.findByCuid2(employee_cuid),
            employmentDao.findByEmployeeCuid(employee_cuid),
            bankDetailDao.findByEmployeeCuid(employee_cuid),
            addressDao.findByEmployeeCuid(employee_cuid),
            educationDao.findByEmployeeCuid(employee_cuid),
            skillDao.findByEmployeeCuid(employee_cuid),
            languageDao.findByEmployeeCuid(employee_cuid),
            documentDao.findByEmployeeCuid(employee_cuid)
        ]);

        return (
            emp !== null &&
            employment !== null &&
            banks.length > 0 &&
            addresses.length > 0 &&
            educations.length > 0 &&
            skills.length > 0 &&
            languages.length > 0 &&
            documents.length > 0
        );
    } catch (error) {
        console.error('Failed to validate if profile is complete', error);
        return false;
    }
}

/**
 * Provisions the employee into IAM (Keycloak) if they are ready and in the 'onboarding' state.
 * Transitions employment_status to 'active' ONLY upon successful provisioning.
 * Idempotent: Can be safely retried.
 */
export async function checkAndProvisionEmployee(employee_cuid: string): Promise<boolean> {
    if (!employee_cuid) return false;

    try {
        const emp = await employeeDao.findByCuid2(employee_cuid);
        if (!emp) return false;

        const employment = await employmentDao.findByEmployeeCuid(employee_cuid);
        if (!employment) return false;

        // Provisioning ONLY applies if employment_status is 'onboarding'
        if (employment.employment_status !== 'onboarding') {
            return false;
        }

        const isReady = await isEmployeeReadyForProvisioning(employee_cuid);
        if (!isReady) {
            return false;
        }

        if (!employment.official_email) {
            throw new Error("Cannot provision user: official_email is missing.");
        }
        if (!employment.system_role_cuid) {
            throw new Error("Cannot provision user: system_role_cuid is missing.");
        }

        console.log(`[PROVISIONING] ========== START ==========
Employee CUID: ${employee_cuid}
Official Email: ${employment.official_email}`);

        let keycloakSub = employment.keycloak_sub;

        if (!keycloakSub) {
            console.log(`[PROVISIONING] Creating Keycloak User`);
            const result = await keycloakService.createUser({
                username: employment.official_email,
                email: employment.official_email,
                firstName: emp.first_name,
                lastName: emp.last_name,
                enabled: true
            });
            keycloakSub = result.keycloakSub;

            console.log(`[PROVISIONING] Keycloak User Created Successfully. UUID: ${keycloakSub}`);
            await employmentDao.upsert(employee_cuid, {
                ...employment,
                keycloak_sub: keycloakSub
            } as employmentDao.UpsertEmploymentInput);
        } else {
            console.log(`[PROVISIONING] Keycloak user already exists: ${keycloakSub}`);
        }

        console.log('[PROVISIONING] Fetching HRMS System Role...');
        const systemRole = await systemRoleDao.findByCuid2(employment.system_role_cuid);
        if (!systemRole) {
            throw new Error(`Cannot provision user: SystemRole ${employment.system_role_cuid} not found`);
        }
        const keycloakRole = await keycloakService.getRealmRole(systemRole.name);
        
        console.log(`[PROVISIONING] Assigning Realm Role: ${keycloakRole.name}`);
        await keycloakService.assignRealmRole(keycloakSub, keycloakRole);

        const requiredActions = ['UPDATE_PASSWORD'];
        console.log(`[PROVISIONING] Triggering onboarding email (UPDATE_PASSWORD)`);
        
        try {
            await keycloakService.triggerRequiredActions(keycloakSub, requiredActions);
        } catch (emailError: any) {
            console.error(`[KC-ERROR-11] Error in triggerRequiredActions()
Complete error object: ${JSON.stringify(emailError, Object.getOwnPropertyNames(emailError))}
Stack trace: ${emailError.stack}
Response status: ${emailError.status || emailError.response?.status || 'N/A'}
Response body: ${JSON.stringify(emailError.details || emailError.response?.data || 'N/A')}`);
            // If email fails, we should still fail the provisioning so it can be retried.
            // The atomic boundary should prevent transitioning to active.
            throw emailError;
        }

        // ATOMICITY: Only update to 'active' if all previous steps succeeded.
        console.log('[PROVISIONING] Transitioning employment_status -> active');
        await employmentDao.upsert(employee_cuid, {
            ...employment,
            keycloak_sub: keycloakSub,
            employment_status: 'active'
        } as employmentDao.UpsertEmploymentInput);

        console.log(`[PROVISIONING] ========== END ==========`);
        return true;
    } catch (error) {
        console.error('[PROVISIONING] Failed to provision employee', error);
        throw error;
    }
}

/**
 * Safely evaluates and updates the profile_completion_status.
 * Supports transitions from Pending -> Completed and Completed -> Pending.
 * Contains no IAM/provisioning logic.
 */
export async function checkAndSetProfileCompletionStatus(employee_cuid: string): Promise<void> {
    if (!employee_cuid) return;

    try {
        const emp = await employeeDao.findByCuid2(employee_cuid);
        if (!emp) return;

        const isComplete = await isEmployeeProfileComplete(employee_cuid);
        const newStatus = isComplete ? 'completed' : 'pending';

        if (emp.profile_completion_status !== newStatus) {
            console.log(`[PROFILE_COMPLETION] Transitioning ${employee_cuid}: ${emp.profile_completion_status} -> ${newStatus}`);
            await employeeDao.update(employee_cuid, { profile_completion_status: newStatus } as employeeDao.UpdateEmployeeInput);
        }
    } catch (error) {
        console.error('[PROFILE_COMPLETION] Failed to process profile completion transition', error);
        throw error;
    }
}

/**
 * Main lifecycle coordinator.
 * Synchronizes the independent state machines for Provisioning and Profile Completion.
 * Should be called whenever employee profile data changes.
 */
export async function syncEmployeeLifecycle(employee_cuid: string): Promise<void> {
    try {
        await checkAndProvisionEmployee(employee_cuid);
    } catch (e) {
        console.error('Provisioning lifecycle failed, proceeding with profile status check', e);
    }
    
    try {
        await checkAndSetProfileCompletionStatus(employee_cuid);
    } catch (e) {
        console.error('Profile completion lifecycle failed', e);
    }
}
