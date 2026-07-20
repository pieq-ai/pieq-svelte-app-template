import * as auditService from '$lib/server/services/audit.service.js';

export const auditFactory = {
	// ==========================================
	// 1. Authentication
	// ==========================================
	async login(userCuid: string, tx?: any) {
		return auditService.log(
			{
				entity_name: 'Auth',
				entity_cuid: userCuid,
				action_type: 'login',
				status: 'SUCCESS',
				remarks: 'User logged in'
			},
			tx
		);
	},

	async loginFailed(userCuid: string, remarks?: string, tx?: any) {
		return auditService.log(
			{
				entity_name: 'Authentication',
				entity_cuid: userCuid,
				action_type: 'login_sync',
				status: 'FAILED',
				remarks: remarks || 'Authorization failed during user synchronization'
			},
			tx
		);
	},

	async logout(userCuid: string, tx?: any) {
		return auditService.log(
			{
				entity_name: 'Auth',
				entity_cuid: userCuid,
				action_type: 'logout',
				status: 'SUCCESS',
				remarks: 'User logged out'
			},
			tx
		);
	},

	// ==========================================
	// 2. Employee
	// ==========================================
	async employeeCreated(
		params: { entityCuid: string; firstName: string; lastName: string; empCode: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Employee',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: `Employee ${params.firstName} ${params.lastName} (${params.empCode}) created.`
			},
			tx
		);
	},

	async employeeUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Employee',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async employeeDeleted(
		params: { entityCuid: string; firstName: string; lastName: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Employee',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: `Employee ${params.firstName} ${params.lastName} soft-deleted.`
			},
			tx
		);
	},

	// ==========================================
	// 3. Employee Child Domains (Address, Education, Experience, BankDetail, Language, Skill)
	// ==========================================
	async addressUpdated(
		params:
			| { addressCuid: string; oldRecord: any; newRecord: any }
			| { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		if ('employeeCuid' in params) {
			return auditService.logListUpdate(
				{
					entityName: 'Employee',
					entityCuid: params.employeeCuid,
					category: 'Address',
					oldList: params.oldList,
					newList: params.newList,
					getItemLabel: (item: any) => `${item.address_type} Address`,
					remarks: 'Addresses updated'
				},
				tx
			);
		}
		return auditService.logUpdate(
			{
				entityName: 'Address',
				entityCuid: params.addressCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async educationUpdated(
		params:
			| { educationCuid: string; oldRecord: any; newRecord: any }
			| { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		if ('employeeCuid' in params) {
			return auditService.logListUpdate(
				{
					entityName: 'Employee',
					entityCuid: params.employeeCuid,
					category: 'Education',
					oldList: params.oldList,
					newList: params.newList,
					getItemLabel: (item: any) => item.degree_diploma || item.qualification,
					remarks: 'Education history updated'
				},
				tx
			);
		}
		return auditService.logUpdate(
			{
				entityName: 'Education',
				entityCuid: params.educationCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async experienceUpdated(
		params:
			| { experienceCuid: string; oldRecord: any; newRecord: any }
			| { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		if ('employeeCuid' in params) {
			return auditService.logListUpdate(
				{
					entityName: 'Employee',
					entityCuid: params.employeeCuid,
					category: 'Experience',
					oldList: params.oldList,
					newList: params.newList,
					getItemLabel: (item: any) => item.company_name,
					remarks: 'Work experience updated'
				},
				tx
			);
		}
		return auditService.logUpdate(
			{
				entityName: 'Experience',
				entityCuid: params.experienceCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async bankDetailCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'BankDetail',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Bank details created'
			},
			tx
		);
	},

	async bankDetailUpdated(
		params:
			| { entityCuid: string; oldRecord: any; newRecord: any }
			| { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		if ('employeeCuid' in params) {
			return auditService.logListUpdate(
				{
					entityName: 'Employee',
					entityCuid: params.employeeCuid,
					category: 'BankDetail',
					oldList: params.oldList,
					newList: params.newList,
					getItemLabel: (item: any) =>
						`${item.bank_name} (${item.account_number ? '...' + item.account_number.slice(-4) : ''})`,
					remarks: 'Bank details updated'
				},
				tx
			);
		}
		return auditService.logUpdate(
			{
				entityName: 'BankDetail',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async languageUpdated(
		params: { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		return auditService.logListUpdate(
			{
				entityName: 'Employee',
				entityCuid: params.employeeCuid,
				category: 'Language',
				oldList: params.oldList,
				newList: params.newList,
				getItemLabel: (item: any) => item.language_name || item.name,
				remarks: 'Languages updated'
			},
			tx
		);
	},

	async skillUpdated(
		params: { employeeCuid: string; oldList: any[]; newList: any[] },
		tx?: any
	) {
		return auditService.logListUpdate(
			{
				entityName: 'Employee',
				entityCuid: params.employeeCuid,
				category: 'Skill',
				oldList: params.oldList,
				newList: params.newList,
				getItemLabel: (item: any) => item.skill_name || item.name,
				remarks: 'Skills updated'
			},
			tx
		);
	},

	// ==========================================
	// 4. Employment
	// ==========================================
	async employmentCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Employment',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Employment record created'
			},
			tx
		);
	},

	async employmentUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Employment',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	// ==========================================
	// 5. Leave & Leave Types
	// ==========================================
	async leaveApplied(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Leave',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Leave application submitted'
			},
			tx
		);
	},

	async leaveApproved(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Leave',
				entity_cuid: params.entityCuid,
				action_type: 'approve',
				status: 'SUCCESS',
				remarks: params.remarks || 'Leave application approved'
			},
			tx
		);
	},

	async leaveRejected(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Leave',
				entity_cuid: params.entityCuid,
				action_type: 'reject',
				status: 'SUCCESS',
				remarks: params.remarks || 'Leave application rejected'
			},
			tx
		);
	},

	async leaveWithdrawn(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Leave',
				entity_cuid: params.entityCuid,
				action_type: 'update',
				status: 'SUCCESS',
				remarks: params.remarks || 'Leave application withdrawn'
			},
			tx
		);
	},

	async leaveTypeCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'LeaveType',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Leave type created'
			},
			tx
		);
	},

	async leaveTypeUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'LeaveType',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	// ==========================================
	// 6. Attendance & Attendance Records
	// ==========================================
	async attendanceCheckedIn(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Attendance',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Checked in'
			},
			tx
		);
	},

	async attendanceCheckedOut(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Attendance',
				entity_cuid: params.entityCuid,
				action_type: 'update',
				status: 'SUCCESS',
				remarks: params.remarks || 'Checked out'
			},
			tx
		);
	},

	async attendanceRecordCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'AttendanceRecord',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Attendance record created'
			},
			tx
		);
	},

	async attendanceRecordUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'AttendanceRecord',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	// ==========================================
	// 7. Shift & Shift Assignment
	// ==========================================
	async shiftCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Shift',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Shift created'
			},
			tx
		);
	},

	async shiftUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Shift',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async shiftAssigned(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'ShiftAssignment',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Shift assigned'
			},
			tx
		);
	},

	async shiftReassigned(
		params: { entityCuid: string; oldRecord?: any; newRecord?: any; remarks?: string },
		tx?: any
	) {
		if (params.oldRecord && params.newRecord) {
			return auditService.logUpdate(
				{
					entityName: 'ShiftAssignment',
					entityCuid: params.entityCuid,
					oldRecord: params.oldRecord,
					newRecord: params.newRecord
				},
				tx
			);
		}
		return auditService.log(
			{
				entity_name: 'ShiftAssignment',
				entity_cuid: params.entityCuid,
				action_type: 'update',
				status: 'SUCCESS',
				remarks: params.remarks || 'Shift reassigned'
			},
			tx
		);
	},

	async shiftRemoved(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'ShiftAssignment',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: params.remarks || 'Shift assignment removed'
			},
			tx
		);
	},

	// ==========================================
	// 8. Holiday
	// ==========================================
	async holidayCreated(
		params: { entityCuid: string; holidayName: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Holiday',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: `Holiday ${params.holidayName} created`
			},
			tx
		);
	},

	async holidayUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Holiday',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async holidayDeleted(
		params: { entityCuid: string; holidayName: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Holiday',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: `Holiday ${params.holidayName} deleted`
			},
			tx
		);
	},

	// ==========================================
	// 9. Salary Structure & Component
	// ==========================================
	async salaryStructureCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'SalaryStructure',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Salary structure created'
			},
			tx
		);
	},

	async salaryStructureUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'SalaryStructure',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async salaryStructureRevised(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'SalaryStructure',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async salaryComponentCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'SalaryComponent',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Salary component created'
			},
			tx
		);
	},

	async salaryComponentUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'SalaryComponent',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	// ==========================================
	// 10. Payroll
	// ==========================================
	async payrollProcessStarted(
		params: { entityCuid: string; month: string | number; year: string | number },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Payroll',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: `Payroll processing started for ${params.month}/${params.year}`
			},
			tx
		);
	},

	async payrollProcessCompleted(
		params: { entityCuid: string; month: string | number; year: string | number },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Payroll',
				entity_cuid: params.entityCuid,
				action_type: 'update',
				status: 'SUCCESS',
				remarks: `Payroll processing completed for ${params.month}/${params.year}`
			},
			tx
		);
	},

	async payrollProcessFailed(
		params: { entityCuid: string; month: string | number; year: string | number; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Payroll',
				entity_cuid: params.entityCuid,
				action_type: 'update',
				status: 'FAILED',
				remarks: params.remarks || `Payroll processing failed for ${params.month}/${params.year}`
			},
			tx
		);
	},

	// ==========================================
	// 11. Department & Designation
	// ==========================================
	async departmentCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Department',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Department created'
			},
			tx
		);
	},

	async departmentUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Department',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async departmentDeleted(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Department',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: params.remarks || 'Department soft-deleted'
			},
			tx
		);
	},

	async designationCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Designation',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Designation created'
			},
			tx
		);
	},

	async designationUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Designation',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async designationDeleted(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Designation',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: params.remarks || 'Designation soft-deleted'
			},
			tx
		);
	},

	// ==========================================
	// 12. Roles & Permissions
	// ==========================================
	async roleCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Role',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Role created'
			},
			tx
		);
	},

	async roleUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'Role',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async rolePermissionsUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'RolePermission',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async systemRoleCreated(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'SystemRole',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'System role created'
			},
			tx
		);
	},

	async systemRoleUpdated(
		params: { entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: 'SystemRole',
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	// ==========================================
	// 13. Documents
	// ==========================================
	async documentUploaded(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Document',
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || 'Document uploaded'
			},
			tx
		);
	},

	async documentDeleted(
		params: { entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: 'Document',
				entity_cuid: params.entityCuid,
				action_type: 'delete',
				status: 'SUCCESS',
				remarks: params.remarks || 'Document deleted'
			},
			tx
		);
	},

	// ==========================================
	// 14. Master Data & Scheduled Jobs
	// ==========================================
	async masterDataCreated(
		params: { entityName: string; entityCuid: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: params.entityName,
				entity_cuid: params.entityCuid,
				action_type: 'create',
				status: 'SUCCESS',
				remarks: params.remarks || `${params.entityName} created`
			},
			tx
		);
	},

	async masterDataUpdated(
		params: { entityName: string; entityCuid: string; oldRecord: any; newRecord: any },
		tx?: any
	) {
		return auditService.logUpdate(
			{
				entityName: params.entityName,
				entityCuid: params.entityCuid,
				oldRecord: params.oldRecord,
				newRecord: params.newRecord
			},
			tx
		);
	},

	async scheduledJobExecuted(
		params: { entityName: string; entityCuid: string; actionType?: string; remarks?: string },
		tx?: any
	) {
		return auditService.log(
			{
				entity_name: params.entityName,
				entity_cuid: params.entityCuid,
				action_type: params.actionType || 'update',
				status: 'SUCCESS',
				remarks: params.remarks || 'Scheduled job executed'
			},
			tx
		);
	}
};
