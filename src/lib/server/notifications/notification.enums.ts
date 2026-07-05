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
	MANAGER = 'manager'
}
