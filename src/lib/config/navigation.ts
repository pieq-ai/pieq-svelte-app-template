import type { Component } from 'svelte';
import Building2Icon from '@lucide/svelte/icons/building-2';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import LinkIcon from '@lucide/svelte/icons/link';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import UserRoundIcon from '@lucide/svelte/icons/user-round';
import UsersRoundIcon from '@lucide/svelte/icons/users-round';
import WalletIcon from '@lucide/svelte/icons/wallet';
import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
import BanknoteIcon from '@lucide/svelte/icons/banknote';
import UserCheckIcon from '@lucide/svelte/icons/user-check';
import MapPinIcon from '@lucide/svelte/icons/map-pin';
import ClockIcon from '@lucide/svelte/icons/clock';
import CalendarIcon from '@lucide/svelte/icons/calendar';
import CalendarCogIcon from '@lucide/svelte/icons/calendar-cog';
import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';

export type NavItem = {
	label: string;
	href: string;
	icon: Component;
	permission: string;
};

export const mainNavItems: NavItem[] = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon, permission: 'dashboard:view' },
	{ label: 'My Profile', href: '/profile', icon: UserRoundIcon, permission: 'profile:view' },
	{ label: 'Employees', href: '/employees', icon: UsersRoundIcon, permission: 'employee:view' },
	{ label: 'Departments', href: '/departments', icon: Building2Icon, permission: 'department:view' },
	{ label: 'Designations', href: '/designations', icon: UserRoundIcon, permission: 'designation:view' },
	{ label: 'Roles', href: '/roles', icon: UserCheckIcon, permission: 'role:view' }
];

export const leaveManagementItems: NavItem[] = [
	{ label: 'Leave Overview', href: '/leaves', icon: CalendarIcon, permission: 'leave:view' },
	{ label: 'Leave Types', href: '/leave-types', icon: CalendarCogIcon, permission: 'leave_type:view' },
	{ label: 'Leave Policies', href: '/leave-policies', icon: ShieldCheckIcon, permission: 'leave_policy:view' },
	{ label: 'Holiday Calendar', href: '/holidays', icon: CalendarIcon, permission: 'holiday:view' }
];

export const attendanceManagementItems: NavItem[] = [
	{ label: 'Locations', href: '/organization_locations', icon: MapPinIcon, permission: 'location:view' },
	{ label: 'Attendance', href: '/attendance', icon: ClockIcon, permission: 'attendance:view' },
	{ label: 'Attendance Records', href: '/attendance-records', icon: CalendarIcon, permission: 'attendance_record:view' }
];

export const shiftManagementItems: NavItem[] = [
	{ label: 'Shifts', href: '/shifts', icon: ClockIcon, permission: 'shift:view' },
	{ label: 'Shift Assignment', href: '/shift-assignments', icon: CalendarCogIcon, permission: 'shift_assignment:view' }
];

export const salaryManagementItems: NavItem[] = [
	{ label: 'Salary Components', href: '/salary-components', icon: WalletIcon, permission: 'salary_component:view' },
	{ label: 'Salary Structures', href: '/salary-structures', icon: ReceiptTextIcon, permission: 'salary_structure:view' },
	{ label: 'Payroll', href: '/payrolls', icon: BanknoteIcon, permission: 'payroll:view' }
];

export const systemNavItems: NavItem[] = [
	{ label: 'System Roles', href: '/system-roles', icon: ShieldCheckIcon, permission: 'system_role:view' },
	{ label: 'Permissions', href: '/permissions', icon: KeyRoundIcon, permission: 'permission:view' },
	{ label: 'Role Permissions', href: '/role-permissions', icon: LinkIcon, permission: 'role_permission:view' }
];
