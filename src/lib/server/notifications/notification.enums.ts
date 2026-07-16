export enum NotificationCategory {
	BIRTHDAY = 'birthday',
	HOLIDAY = 'holiday',
	ANNOUNCEMENT = 'announcement',
	PAYROLL = 'payroll',
	LEAVE = 'leave',
	ATTENDANCE = 'attendance',
	SYSTEM = 'system'
}

export enum NotificationPriority {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	URGENT = 'urgent'
}

export enum NotificationType {
	INFO = 'info',
	SUCCESS = 'success',
	WARNING = 'warning',
	ERROR = 'error'
}

export enum NotificationTargetType {
	BROADCAST = 'broadcast',
	EMPLOYEE = 'employee',
	ROLE = 'role',
	DEPARTMENT = 'department',
	/**
	 * Caller-supplied list of employee CUIDs.
	 * The Factory is responsible for building this list from business context.
	 * Use this instead of adding business-specific target types (e.g. EMPLOYEE_AND_MANAGER).
	 */
	CUSTOM = 'custom'
}
