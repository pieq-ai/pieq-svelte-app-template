<script lang="ts">
	import { onMount } from 'svelte';

	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import {
		Badge,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		Input,
		CrudModal,
		Pagination,
		DatePicker
	} from '$lib/components';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import { GEOFENCE_CONFIG, calculateDistance } from '$lib/geofence.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedEmployeeUuid = $state('');
	let isSubmitting = $state(false);

	// GPS Geofence States
	let gpsLatitude = $state<number | null>(null);
	let gpsLongitude = $state<number | null>(null);
	let locationError = $state<string | null>(null);
	let locationPermissionDenied = $state(false);
	let isLocating = $state(false);

	let distanceFromOffice = $derived.by(() => {
		if (gpsLatitude === null || gpsLongitude === null) return null;
		return calculateDistance(
			gpsLatitude,
			gpsLongitude,
			GEOFENCE_CONFIG.OFFICE_LATITUDE,
			GEOFENCE_CONFIG.OFFICE_LONGITUDE
		);
	});

	let gpsValidation = $derived.by(() => {
		if (locationPermissionDenied) {
			return {
				isValid: false,
				status: 'Outside Office Zone',
				message: 'Location permission denied. Please allow location access to mark attendance.'
			};
		}
		if (locationError) {
			return {
				isValid: false,
				status: 'Location Error',
				message: `Location error: ${locationError}`
			};
		}
		if (isLocating && gpsLatitude === null) {
			return {
				isValid: false,
				status: 'Determining Location...',
				message: 'Getting your current location...'
			};
		}
		if (gpsLatitude === null || gpsLongitude === null) {
			return {
				isValid: false,
				status: 'Location Unavailable',
				message: 'Unable to determine your location.'
			};
		}

		const dist = calculateDistance(
			gpsLatitude,
			gpsLongitude,
			GEOFENCE_CONFIG.OFFICE_LATITUDE,
			GEOFENCE_CONFIG.OFFICE_LONGITUDE
		);
		const isInside = dist <= GEOFENCE_CONFIG.ALLOWED_RADIUS_METERS;

		return {
			isValid: isInside,
			status: isInside ? 'Inside Office Zone' : 'Outside Office Zone',
			message: isInside
				? 'You are within the office zone. Attendance marking is enabled.'
				: `You are outside the office zone (Distance: ${Math.round(dist)}m).`
		};
	});

	onMount(() => {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}

		isLocating = true;
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				gpsLatitude = position.coords.latitude;
				gpsLongitude = position.coords.longitude;
				locationError = null;
				locationPermissionDenied = false;
				isLocating = false;
			},
			(error) => {
				isLocating = false;
				if (error.code === error.PERMISSION_DENIED) {
					locationPermissionDenied = true;
					locationError = 'Location permission denied. Please allow location access to mark attendance.';
				} else {
					locationError = error.message || 'Unable to determine location';
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 0
			}
		);

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	});

	// Employee-specific history and active record state
	let historyRecords = $state<any[]>([]);
	let isLoadingHistory = $state(false);

	let historyCurrentPage = $state(1);
	let historyFilterStatus = $state<string>('all');
	let historyFilterStartDate = $state('');
	let historyFilterEndDate = $state('');
	let historySortKey = $state<string | null>('date');
	let historySortDirection = $state<'asc' | 'desc' | null>('desc');

	function handleHistorySort(key: string) {
		historyCurrentPage = 1;
		if (historySortKey !== key) {
			historySortKey = key;
			historySortDirection = 'asc';
		} else if (historySortDirection === 'asc') {
			historySortDirection = 'desc';
		} else {
			historySortKey = null;
			historySortDirection = null;
		}
	}

	const historyFilterStatusOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'Present', label: 'Present' },
		{ value: 'Leave', label: 'Leave' },
		{ value: 'LOP', label: 'LOP' },
		{ value: 'Half Day', label: 'Half Day' },
		{ value: 'WFH', label: 'WFH' }
	];

	let filteredHistory = $derived.by(() => {
		let result = [...historyRecords];

		if (historyFilterStatus !== 'all') {
			result = result.filter((r) => r.status === historyFilterStatus || (r.status === 'Absent' && historyFilterStatus === 'LOP'));
		}

		if (historyFilterStartDate) {
			result = result.filter((r) => getISODateString(r.date) >= historyFilterStartDate);
		}

		if (historyFilterEndDate) {
			result = result.filter((r) => getISODateString(r.date) <= historyFilterEndDate);
		}

		if (historySortKey && historySortDirection) {
			result.sort((a, b) => {
				const key = historySortKey as string;
				const valA = a[key];
				const valB = b[key];

				if (key === 'date' || key === 'check_in_time' || key === 'check_out_time') {
					const timeA = valA ? new Date(valA).getTime() : 0;
					const timeB = valB ? new Date(valB).getTime() : 0;
					return historySortDirection === 'asc' ? timeA - timeB : timeB - timeA;
				}

				if (key === 'work_duration_minutes') {
					const durA = valA || 0;
					const durB = valB || 0;
					return historySortDirection === 'asc' ? durA - durB : durB - durA;
				}

				if (typeof valA === 'string' && typeof valB === 'string') {
					return historySortDirection === 'asc'
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}

				return 0;
			});
		} else {
			result.sort((a, b) => {
				const timeA = new Date(a.date).getTime();
				const timeB = new Date(b.date).getTime();
				return timeB - timeA; // default sort desc
			});
		}

		return result;
	});

	let paginatedHistory = $derived(filteredHistory.slice((historyCurrentPage - 1) * 10, historyCurrentPage * 10));

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		historyFilterStatus;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		historyFilterStartDate;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		historyFilterEndDate;
		historyCurrentPage = 1;
	});

	// Local state for dropdown searching
	let empSearchQuery = $state('');

	let selectedEmployee = $derived(
		data.employees.find((emp: any) => emp.uuid === selectedEmployeeUuid) || null
	);

	let isRelieved = $derived.by(() => {
		if (!selectedEmployee || !selectedEmployee.relieving_date) return false;
		const relieveStr = getISODateString(selectedEmployee.relieving_date);
		return data.todayStr > relieveStr;
	});

	let todayRecord = $derived(
		historyRecords.find((rec: any) => rec.date === data.todayStr) || null
	);

	let employeeOptions = $derived(
		data.employees.map((emp: any) => ({
			id: emp.uuid,
			label: `${emp.name} (Age: ${emp.age})`
		}))
	);

	let filteredEmployeeOptions = $derived.by(() => {
		const q = empSearchQuery.toLowerCase().trim();
		if (!q) return employeeOptions;
		return employeeOptions.filter(o => o.label.toLowerCase().includes(q));
	});

	// Monthly Calendar navigation
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else {
			currentMonth -= 1;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth += 1;
		}
	}

	let calendarMonthDays = $derived.by(() => {
		const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
		const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

		const days = [];

		// Prev month days
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const prevMonthVal = currentMonth === 0 ? 11 : currentMonth - 1;
			const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
			const dayVal = totalDaysInPrevMonth - i;
			const cellDateStr = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
			days.push({
				day: dayVal,
				month: prevMonthVal,
				year: prevYearVal,
				isCurrentMonth: false,
				isToday: false,
				dateStr: cellDateStr
			});
		}

		// Current month days
		const todayDate = new Date();
		for (let i = 1; i <= totalDaysInMonth; i++) {
			const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: currentMonth,
				year: currentYear,
				isCurrentMonth: true,
				isToday: todayDate.getDate() === i && todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear,
				dateStr: cellDateStr
			});
		}

		// Next month days to fill grid of 42
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;
			const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
			const cellDateStr = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: nextMonthVal,
				year: nextYearVal,
				isCurrentMonth: false,
				isToday: false,
				dateStr: cellDateStr
			});
		}

		return days;
	});

	function getISODateString(dateInput: string | Date): string {
		const d = new Date(dateInput);
		const year = d.getUTCFullYear();
		const month = String(d.getUTCMonth() + 1).padStart(2, '0');
		const day = String(d.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getDayStatus(dateStr: string) {
		const isHoliday = data.holidays.some((h: any) => getISODateString(h.date) === dateStr);
		if (isHoliday) {
			return { status: 'Holiday', color: 'bg-blue-500/15 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/40' };
		}

		const record = historyRecords.find((rec) => rec.date === dateStr);
		if (record) {
			const status = record.status;
			if (status === 'Present' || status === 'Late') {
				return { status: 'Present', color: 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40' };
			}
			if (status === 'Half Day') {
				return { status: 'Half Day', color: 'bg-purple-500/15 text-purple-800 dark:bg-purple-500/25 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40' };
			}
			if (status === 'WFH') {
				return { status: 'WFH', color: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-500/40' };
			}
			if (status === 'On Leave' || status === 'Leave') {
				return { status: 'Leave', color: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40' };
			}
			if (status === 'LOP' || status === 'Absent') {
				return { status: 'LOP', color: 'bg-red-500/15 text-red-800 dark:bg-red-500/25 dark:text-red-300 border border-red-500/30 dark:border-red-500/40' };
			}
			if (status === 'Week Off') {
				return { status: 'Week Off', color: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300 border border-slate-500/30 dark:border-slate-500/40' };
			}
		}

		// Detect Week Off (Saturday & Sunday)
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1;
			const day = parseInt(parts[2], 10);
			const dateObj = new Date(year, month, day);
			const dayOfWeek = dateObj.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				return { status: 'Week Off', color: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300 border border-slate-500/30 dark:border-slate-500/40' };
			}
		}

		return null;
	}

	function getHolidayForDate(dateStr: string) {
		return data.holidays.find((h: any) => getISODateString(h.date) === dateStr) || null;
	}

	function formatHolidayType(type: string): string {
		if (!type) return '';
		const lower = type.toLowerCase();
		if (lower.includes('holiday')) {
			return type;
		}
		return `${type} Holiday`;
	}

	// Dynamic stats cards metrics for the currently selected month
	let monthlyStats = $derived.by(() => {
		let present = 0;
		let leave = 0;
		let lop = 0;
		let workingDays = 0;
		let halfDays = 0;
		let wfhDays = 0;

		for (const d of calendarMonthDays) {
			if (!d.isCurrentMonth) continue;

			const statusObj = getDayStatus(d.dateStr);
			if (statusObj) {
				if (statusObj.status === 'Present') {
					present++;
				} else if (statusObj.status === 'Leave') {
					leave++;
				} else if (statusObj.status === 'LOP') {
					lop++;
				} else if (statusObj.status === 'Half Day') {
					halfDays++;
				} else if (statusObj.status === 'WFH') {
					wfhDays++;
				}
			}

			// Calculate working days (business days)
			const parts = d.dateStr.split('-');
			if (parts.length === 3) {
				const year = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				const day = parseInt(parts[2], 10);
				const dateObj = new Date(year, month, day);
				const dayOfWeek = dateObj.getDay();
				const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
				const isHoliday = data.holidays.some((h: any) => getISODateString(h.date) === d.dateStr);

				if (!isWeekend && !isHoliday) {
					workingDays++;
				}
			}
		}

		return {
			totalWorkingDays: workingDays,
			presentDays: present,
			leaveDays: leave,
			lopDays: lop,
			halfDays: halfDays,
			wfhDays: wfhDays
		};
	});

	function parseLocalDate(dateStr: string): Date {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	function isInCurrentWeek(dateStr: string, todayStr: string): boolean {
		const date = parseLocalDate(dateStr);
		const today = parseLocalDate(todayStr);

		// Find the Monday of today's week
		const todayDay = today.getDay(); // 0 is Sunday, 1 is Monday, ...
		const diffToMonday = todayDay === 0 ? -6 : 1 - todayDay;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const mondayOfTodayWeek = new Date(today);
		mondayOfTodayWeek.setDate(today.getDate() + diffToMonday);
		mondayOfTodayWeek.setHours(0, 0, 0, 0);

		// Sunday of today's week
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const sundayOfTodayWeek = new Date(mondayOfTodayWeek);
		sundayOfTodayWeek.setDate(mondayOfTodayWeek.getDate() + 6);
		sundayOfTodayWeek.setHours(23, 59, 59, 999);

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const recordDate = new Date(date);
		recordDate.setHours(0, 0, 0, 0);

		return recordDate >= mondayOfTodayWeek && recordDate <= sundayOfTodayWeek;
	}

	function isInCurrentMonth(dateStr: string, todayStr: string): boolean {
		const [rYear, rMonth] = dateStr.split('-');
		const [tYear, tMonth] = todayStr.split('-');
		return rYear === tYear && rMonth === tMonth;
	}

	let filterPeriod = $state<'week' | 'month' | 'overall'>('month');

	let filterPeriodLabel = $derived(
		filterPeriod === 'week' ? 'This Week' : filterPeriod === 'month' ? 'This Month' : 'Overall'
	);

	const filterPeriodOptions: { value: 'week' | 'month' | 'overall'; label: string }[] = [
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' },
		{ value: 'overall', label: 'Overall' }
	];

	let averageWorkingHours = $derived.by(() => {
		let totalMinutes = 0;
		let totalWorkingDays = 0;

		for (const r of historyRecords) {
			if (!r.date) continue;

			// Ignore future dates
			if (r.date > data.todayStr) continue;

			// Apply period filter
			if (filterPeriod === 'week') {
				if (!isInCurrentWeek(r.date, data.todayStr)) continue;
			} else if (filterPeriod === 'month') {
				if (!isInCurrentMonth(r.date, data.todayStr)) continue;
			}

			// Exclude weekends/week-offs entirely from both hours and days
			const dateObj = parseLocalDate(r.date);
			const dayOfWeek = dateObj.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				continue;
			}

			// Exclude holidays from both hours and days
			const isHoliday = data.holidays.some((h: any) => getISODateString(h.date) === r.date);
			if (isHoliday) {
				continue;
			}

			// Exclude leaves and LOPs from both hours and days
			const status = r.status;
			if (status === 'Leave' || status === 'On Leave' || status === 'LOP' || status === 'Absent') {
				continue;
			}

			// Ignore attendance entries without a completed check-out
			if (!r.check_out_time || r.work_duration_minutes === null || r.work_duration_minutes === undefined) {
				continue;
			}

			// Count only actual attendance duration from valid weekday attendance records
			const duration = r.work_duration_minutes;
			if (duration !== null && duration !== undefined && duration >= 0) {
				totalMinutes += duration;
			}

			// Count working days:
			// Present = 1 day, Half Day = 0.5 day
			// WFH = 1 day
			if (status === 'Present' || status === 'Late' || status === 'WFH') {
				totalWorkingDays += 1;
			} else if (status === 'Half Day') {
				totalWorkingDays += 0.5;
			}
		}

		if (totalWorkingDays === 0) return '0h 00m';

		const avgMinutes = Math.round(totalMinutes / totalWorkingDays);
		const hrs = Math.floor(avgMinutes / 60);
		const mins = avgMinutes % 60;
		return `${hrs}h ${String(mins).padStart(2, '0')}m`;
	});

	let attendancePercentage = $derived.by(() => {
		const total = monthlyStats.presentDays + monthlyStats.lopDays + monthlyStats.leaveDays + monthlyStats.halfDays + monthlyStats.wfhDays;
		if (total === 0) return 0;
		return Math.round(((monthlyStats.presentDays + monthlyStats.wfhDays + monthlyStats.halfDays) / total) * 100);
	});

	// Load employee specific data
	async function loadEmployeeData(employeeUuid: string) {
		if (!employeeUuid) {
			historyRecords = [];
			return;
		}

		isLoadingHistory = true;
		try {
			const res = await fetch(`/api/attendance/${employeeUuid}`);
			const body = await res.json();
			if (res.ok) {
				historyRecords = body.data || [];
			} else {
				toast.error(body.data?.error || 'Failed to load history');
			}
		} catch (error) {
			console.error(error);
			toast.error('Failed to retrieve history');
		} finally {
			isLoadingHistory = false;
		}
	}

	$effect(() => {
		loadEmployeeData(selectedEmployeeUuid);
	});

	// Helper formatters
	function formatDisplayDate(dateStr: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const year = parts[0];
		const monthIndex = parseInt(parts[1], 10) - 1;
		const day = parts[2];
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${day}-${monthNames[monthIndex]}-${year}`;
	}

	function formatDisplayTime(timeStr: string | null) {
		if (!timeStr) return '--';
		const date = new Date(timeStr);
		if (isNaN(date.getTime())) return '--';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(minutes: number | null) {
		if (minutes === null || minutes === undefined) return '--';
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hrs} hrs ${String(mins).padStart(2, '0')} min`;
	}

	function formatCalDuration(minutes: number | null) {
		if (minutes === null || minutes === undefined) return '';
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hrs}h ${String(mins).padStart(2, '0')}m`;
	}

	function getSourceName(cuid: string | null): string {
		if (!cuid) return '--';
		const src = data.sources.find((s: any) => s.id === cuid);
		return src ? src.label : cuid;
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'Present':
				return 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40';
			case 'Late':
				return 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40';
			case 'Half Day':
				return 'bg-purple-500/15 text-purple-800 dark:bg-purple-500/25 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40';
			case 'On Leave':
			case 'Leave':
				return 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40';
			case 'LOP':
			case 'Absent':
				return 'bg-red-500/15 text-red-800 dark:bg-red-500/25 dark:text-red-300 border border-red-500/30 dark:border-red-500/40';
			case 'Week Off':
				return 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300 border border-slate-500/30 dark:border-slate-500/40';
			case 'Holiday':
				return 'bg-blue-500/15 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/40';
			case 'WFH':
				return 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-500/40';
			default:
				return '';
		}
	}

	// Actions
	async function handleCheckIn() {
		if (!selectedEmployeeUuid) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: selectedEmployeeUuid,
					attendance_source_cuid: null,
					latitude: gpsLatitude,
					longitude: gpsLongitude
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked in successfully!');
				await loadEmployeeData(selectedEmployeeUuid);
			} else {
				const errorMsg = body.data?.error 
					? (typeof body.data.error === 'object' ? Object.values(body.data.error).join(', ') : body.data.error)
					: 'Check-in failed';
				toast.error(errorMsg);
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred during check-in');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCheckOut() {
		if (!selectedEmployeeUuid) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-out', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: selectedEmployeeUuid,
					latitude: gpsLatitude,
					longitude: gpsLongitude
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked out successfully!');
				await loadEmployeeData(selectedEmployeeUuid);
			} else {
				const errorMsg = body.data?.error 
					? (typeof body.data.error === 'object' ? Object.values(body.data.error).join(', ') : body.data.error)
					: 'Check-out failed';
				toast.error(errorMsg);
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred during check-out');
		} finally {
			isSubmitting = false;
		}
	}

	function scrollIntoView(node: HTMLElement, condition: boolean) {
		if (condition) {
			setTimeout(() => {
				const parent = node.closest('[data-slot="dropdown-menu-item"]');
				if (parent) {
					parent.scrollIntoView({ block: 'nearest', behavior: 'auto' });
				} else {
					node.scrollIntoView({ block: 'nearest', behavior: 'auto' });
				}
			}, 50);
		}
	}
</script>

<svelte:head>
	<title>Attendance</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="space-y-1 border-b border-border pb-6">
		
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
			Attendance
		</h1>
		
	</div>

	<!-- Employee Selector (Demo Context) -->
	<Card>
		<CardContent class="p-6">
			<div class="max-w-md space-y-2">
				<Label>Select Employee (Demo context user) <span class="text-destructive">*</span></Label>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-2">
									{selectedEmployeeUuid ? (employeeOptions.find(o => o.id === selectedEmployeeUuid)?.label || 'Select Employee') : 'Select Employee'}
								</span>
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
						<div class="flex items-center border-b border-border px-3 py-2 bg-transparent">
							<SearchIcon class="mr-2 size-4 shrink-0 opacity-50" />
							<input
								type="text"
								bind:value={empSearchQuery}
								placeholder="Search employee..."
								class="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground"
							/>
							{#if empSearchQuery}
								<button
									type="button"
									onclick={() => (empSearchQuery = '')}
									class="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-accent cursor-pointer"
									title="Clear search"
									aria-label="Clear search"
								>
									<XIcon class="size-3" />
								</button>
							{/if}
						</div>
						<DropdownMenu.Group>
							{#each filteredEmployeeOptions as opt}
								<DropdownMenu.Item
									onclick={() => {
										selectedEmployeeUuid = opt.id;
										empSearchQuery = '';
									}}
									class="justify-between cursor-pointer {selectedEmployeeUuid === opt.id ? 'bg-accent text-accent-foreground font-semibold' : ''}"
								>
									<span class="truncate">{opt.label}</span>
									{#if selectedEmployeeUuid === opt.id}
										<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
									{/if}
								</DropdownMenu.Item>
							{:else}
								<div class="px-3 py-4 text-sm text-muted-foreground text-center">
									No employees found
								</div>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</CardContent>
	</Card>

	{#if !selectedEmployeeUuid}
		<div class="text-center py-16 border rounded-lg bg-card text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
			<span>Please select an employee to view their attendance dashboard.</span>
		</div>
	{:else}

		<!-- Stats Summary Cards -->
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Working Days</p>
						<div class="text-3xl font-bold">{monthlyStats.totalWorkingDays}</div>
					</div>
					<span class="size-3 rounded-full bg-slate-400 shadow-sm shadow-slate-400/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Present Days</p>
						<div class="text-3xl font-bold">{monthlyStats.presentDays}</div>
					</div>
					<span class="size-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leave Days</p>
						<div class="text-3xl font-bold">{monthlyStats.leaveDays}</div>
					</div>
					<span class="size-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Half Day</p>
						<div class="text-3xl font-bold">{monthlyStats.halfDays}</div>
					</div>
					<span class="size-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">WFH</p>
						<div class="text-3xl font-bold">{monthlyStats.wfhDays}</div>
					</div>
					<span class="size-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">LOP Days</p>
						<div class="text-3xl font-bold">{monthlyStats.lopDays}</div>
					</div>
					<span class="size-3 rounded-full bg-destructive shadow-sm shadow-destructive/50"></span>
				</CardContent>
			</Card>
		</div>

		<div>
			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between h-full">
					<div class="space-y-1.5">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Average Working Hours</p>
						<div class="text-3xl font-bold">{averageWorkingHours}</div>
						<p class="text-xs text-muted-foreground font-medium">Filter: {filterPeriodLabel}</p>
					</div>
					<div>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
										<span class="truncate pr-1">
											{filterPeriodLabel}
										</span>
										<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-36">
								<DropdownMenu.Group>
									{#each filterPeriodOptions as opt}
										<DropdownMenu.Item
											onclick={() => filterPeriod = opt.value}
											class="justify-between cursor-pointer {filterPeriod === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}"
										>
											<span>{opt.label}</span>
											{#if filterPeriod === opt.value}
												<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
											{/if}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Calendar View Card -->
		<Card class="bg-card">
			<CardHeader>
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<CardTitle>Attendance Calendar</CardTitle>
						<div class={cn(
							"px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border transition-all duration-300 shadow-xs uppercase tracking-wider",
							gpsValidation.status === 'Inside Office Zone'
								? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40"
								: (gpsValidation.status === 'Determining Location...'
									? "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
									: "bg-destructive/10 text-destructive border-destructive/30")
						)}>
							<span class={cn(
								"size-1.5 rounded-full",
								gpsValidation.status === 'Inside Office Zone' ? "bg-emerald-500" : "bg-destructive"
							)}></span>
							{gpsValidation.status}
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Button variant="outline" size="icon-sm" onclick={prevMonth} title="Previous Month">
							‹
						</Button>
						
						<!-- Month Dropdown -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
										<span class="truncate pr-1">
											{monthNames[currentMonth]}
										</span>
										<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-36 max-h-60 overflow-y-auto">
								<DropdownMenu.Group>
									{#each monthNames as monthName, index}
										<DropdownMenu.Item
											onclick={() => currentMonth = index}
											class="justify-between cursor-pointer {currentMonth === index ? 'bg-accent text-accent-foreground font-semibold' : ''}"
										>
											<span use:scrollIntoView={currentMonth === index}>{monthName}</span>
											{#if currentMonth === index}
												<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
											{/if}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<!-- Year Dropdown -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" class="h-9 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
										<span class="truncate pr-1">
											{currentYear}
										</span>
										<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-28 max-h-60 overflow-y-auto">
								<DropdownMenu.Group>
									{#each Array.from({ length: 101 }, (_, i) => 2000 + i) as yearVal}
										<DropdownMenu.Item
											onclick={() => currentYear = yearVal}
											class="justify-between cursor-pointer {currentYear === yearVal ? 'bg-accent text-accent-foreground font-semibold' : ''}"
										>
											<span use:scrollIntoView={currentYear === yearVal}>{yearVal}</span>
											{#if currentYear === yearVal}
												<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
											{/if}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<Button variant="outline" size="icon-sm" onclick={nextMonth} title="Next Month">
							›
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<!-- Legend -->
				<div class="flex flex-wrap gap-4 mb-6 text-xs font-semibold">
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-emerald-500/15 border border-emerald-500/30 dark:bg-emerald-500/25 dark:border-emerald-500/40"></span>
						<span class="text-muted-foreground">Present</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-blue-500/15 border border-blue-500/30 dark:bg-blue-500/25 dark:border-blue-500/40"></span>
						<span class="text-muted-foreground">Holiday</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-slate-500/15 border border-slate-500/30 dark:bg-slate-500/25 dark:border-slate-500/40"></span>
						<span class="text-muted-foreground">Week Off</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-amber-500/15 border border-amber-500/30 dark:bg-amber-500/25 dark:border-amber-500/40"></span>
						<span class="text-muted-foreground">Leave</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-red-500/15 border border-red-500/30 dark:bg-red-500/25 dark:border-red-500/40"></span>
						<span class="text-muted-foreground">LOP (Loss of Pay)</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-purple-500/15 border border-purple-500/30 dark:bg-purple-500/25 dark:border-purple-500/40"></span>
						<span class="text-muted-foreground">Half Day</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-cyan-500/15 border border-cyan-500/30 dark:bg-cyan-500/25 dark:border-cyan-500/40"></span>
						<span class="text-muted-foreground">WFH</span>
					</div>
				</div>

				<!-- Weekdays Header -->
				<div class="grid grid-cols-7 gap-2 text-center text-xs font-bold mb-2 uppercase text-muted-foreground tracking-wider">
					{#each weekdays as day}
						<div class="py-2">{day}</div>
					{/each}
				</div>

				<!-- Grid of Days -->
				<div class="grid grid-cols-7 gap-2">
					{#each calendarMonthDays as cell}
						{@const record = historyRecords.find((rec) => rec.date === cell.dateStr)}
						{@const dayStatus = getDayStatus(cell.dateStr)}
						{@const holiday = getHolidayForDate(cell.dateStr)}
						<div
							class={cn(
								"min-h-24 p-2.5 rounded-lg border border-border/50 flex flex-col justify-between transition-all relative",
								cell.isCurrentMonth ? "bg-card text-foreground" : "bg-muted/10 text-muted-foreground opacity-50",
								cell.isToday && "ring-2 ring-[#F45310] ring-offset-2 ring-offset-background",
								dayStatus ? dayStatus.color : "hover:bg-muted/30"
							)}
						>
							<div class="flex items-center justify-between w-full">
								<span class="text-base font-bold">{cell.day}</span>
								{#if dayStatus}
									<span class="text-xs font-extrabold tracking-tight uppercase line-clamp-1">{dayStatus.status}</span>
								{/if}
							</div>

							<div class="mt-1 flex-1 flex flex-col justify-end w-full">
								{#if holiday}
									<!-- Holiday Info Mode -->
									<div class="space-y-1 text-left w-full mt-1">
										<div class="text-xs font-bold leading-tight line-clamp-2">
											{holiday.name}
										</div>
										<div class="text-[9.5px] opacity-90 font-bold leading-none">
											{formatHolidayType(holiday.type)}
										</div>
									</div>
								{:else if record && record.check_in_time}
									<div class="flex items-center justify-between w-full text-xs font-bold leading-tight">
										<span>{formatDisplayTime(record.check_in_time)}</span>
										<span>{record.check_out_time ? formatDisplayTime(record.check_out_time) : '--'}</span>
									</div>
									{#if record.check_out_time}
										<div class="text-center text-xs font-bold mt-1">
											{formatCalDuration(record.work_duration_minutes)}
										</div>
									{/if}
								{/if}

								{#if cell.isToday && !holiday && !['Leave', 'LOP'].includes(dayStatus?.status ?? '')}
									{#if !record}
										{#if !isRelieved}
											<Button
												size="sm"
												onclick={(e) => { e.stopPropagation(); handleCheckIn(); }}
												class="w-full mt-1 h-5 text-[9px] px-1 bg-[#F45310] hover:bg-[#F45310]/90 text-white font-bold rounded-sm border-none shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={isSubmitting || !gpsValidation.isValid || isLoadingHistory}
												title={!gpsValidation.isValid ? gpsValidation.message : (isLoadingHistory ? 'Loading history...' : '')}
											>
												Check In
											</Button>
										{/if}
									{:else if record && !record.check_out_time}
										<Button
											size="sm"
											onclick={(e) => { e.stopPropagation(); handleCheckOut(); }}
											class="w-full mt-1 h-5 text-[9px] px-1 bg-[#800020] hover:bg-[#800020]/90 text-white font-bold rounded-sm border-none shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
											disabled={isSubmitting || !gpsValidation.isValid || isLoadingHistory}
											title={!gpsValidation.isValid ? gpsValidation.message : (isLoadingHistory ? 'Loading history...' : '')}
										>
											Check Out
										</Button>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Employee Specific Table -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle>Attendance History</CardTitle>
			</CardHeader>
			<CardContent>
				{#if isLoadingHistory}
					<div class="text-center py-12 text-muted-foreground font-medium flex items-center justify-center gap-2">
						<LoaderCircleIcon class="size-5 animate-spin text-muted-foreground" />
						Loading records...
					</div>
				{:else}
					<div class="space-y-3">
						<!-- Filters -->
						<div class="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto mt-2 mb-4">
							<div class="w-full sm:w-40">
								<DatePicker
									placeholder="Start Date"
									bind:value={historyFilterStartDate}
									max={historyFilterEndDate || '2099-12-31'}
									isFilter={true}
								/>
							</div>
							<div class="w-full sm:w-40">
								<DatePicker
									placeholder="End Date"
									bind:value={historyFilterEndDate}
									min={historyFilterStartDate}
									isFilter={true}
								/>
							</div>
							<div class="w-full sm:w-48">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
												<span class="truncate pr-2">{historyFilterStatusOptions.find(o => o.value === historyFilterStatus)?.label || 'All Status'}</span>
												<FilterIcon class="ml-2 size-4 opacity-50 shrink-0" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)]">
										<DropdownMenu.Group>
											{#each historyFilterStatusOptions as opt}
												<DropdownMenu.Item onclick={() => { historyFilterStatus = opt.value; historyCurrentPage = 1; }} class="justify-between cursor-pointer {historyFilterStatus === opt.value ? 'bg-accent text-accent-foreground' : ''}">
													<span class="truncate pr-2">{opt.label}</span>
													{#if historyFilterStatus === opt.value}<CheckIcon class="size-4 shrink-0 text-[#F45310]" />{/if}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>

						<Card class="py-0">
							<Table>
								<TableHeader class="bg-muted">
									<TableRow>
										<TableHead class="font-bold text-foreground text-[15px]">
											<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleHistorySort('date')}>
												Date
											{#if historySortKey === 'date' && historySortDirection === 'asc'}
												<ArrowUpIcon class="ml-2 size-4" />
											{:else if historySortKey === 'date' && historySortDirection === 'desc'}
												<ArrowDownIcon class="ml-2 size-4" />
											{:else}
												<ArrowUpDownIcon class="ml-2 size-4" />
											{/if}
											</Button>
										</TableHead>
										<TableHead class="font-bold text-foreground text-[15px]">
											<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleHistorySort('check_in_time')}>
												Check In
											{#if historySortKey === 'check_in_time' && historySortDirection === 'asc'}
												<ArrowUpIcon class="ml-2 size-4" />
											{:else if historySortKey === 'check_in_time' && historySortDirection === 'desc'}
												<ArrowDownIcon class="ml-2 size-4" />
											{:else}
												<ArrowUpDownIcon class="ml-2 size-4" />
											{/if}
											</Button>
										</TableHead>
										<TableHead class="font-bold text-foreground text-[15px]">
											<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleHistorySort('check_out_time')}>
												Check Out
											{#if historySortKey === 'check_out_time' && historySortDirection === 'asc'}
												<ArrowUpIcon class="ml-2 size-4" />
											{:else if historySortKey === 'check_out_time' && historySortDirection === 'desc'}
												<ArrowDownIcon class="ml-2 size-4" />
											{:else}
												<ArrowUpDownIcon class="ml-2 size-4" />
											{/if}
											</Button>
										</TableHead>
										<TableHead class="font-bold text-foreground text-[15px]">
											<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleHistorySort('work_duration_minutes')}>
												Duration
											{#if historySortKey === 'work_duration_minutes' && historySortDirection === 'asc'}
												<ArrowUpIcon class="ml-2 size-4" />
											{:else if historySortKey === 'work_duration_minutes' && historySortDirection === 'desc'}
												<ArrowDownIcon class="ml-2 size-4" />
											{:else}
												<ArrowUpDownIcon class="ml-2 size-4" />
											{/if}
											</Button>
										</TableHead>
										<TableHead class="font-bold text-foreground text-[15px]">
											<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleHistorySort('status')}>
												Status
											{#if historySortKey === 'status' && historySortDirection === 'asc'}
												<ArrowUpIcon class="ml-2 size-4" />
											{:else if historySortKey === 'status' && historySortDirection === 'desc'}
												<ArrowDownIcon class="ml-2 size-4" />
											{:else}
												<ArrowUpDownIcon class="ml-2 size-4" />
											{/if}
											</Button>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#if filteredHistory.length === 0}
										<TableRow>
											<TableCell colspan={5} class="text-center py-8 text-muted-foreground">
												{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
											</TableCell>
										</TableRow>
									{:else}
										{#each paginatedHistory as rec (rec.cuid)}
											<TableRow>
												<TableCell class="font-semibold">{formatDisplayDate(rec.date)}</TableCell>
												<TableCell>{formatDisplayTime(rec.check_in_time)}</TableCell>
												<TableCell>{formatDisplayTime(rec.check_out_time)}</TableCell>
												<TableCell>{formatDuration(rec.work_duration_minutes)}</TableCell>
												<TableCell>
													<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(rec.status === 'Absent' ? 'LOP' : rec.status)}`}>
														{rec.status === 'Absent' ? 'LOP' : rec.status}
													</Badge>
												</TableCell>
											</TableRow>
										{/each}
									{/if}
								</TableBody>
							</Table>
						</Card>
						<Pagination totalItems={filteredHistory.length} bind:currentPage={historyCurrentPage} pageSize={10} />
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
