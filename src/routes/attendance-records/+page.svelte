<script lang="ts">
	import { slide } from 'svelte/transition';
	import { invalidate, goto, beforeNavigate } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';

	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		Badge,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		DatePicker,
		ConfirmModal,
		CrudModal,
		Pagination,
		TableActions,
		SearchInput
	} from '$lib/components';
	import TimePicker from '$lib/components/common/TimePicker.svelte';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData } from './$types';
	import { cn } from '$lib/utils.js';

	let { data }: { data: PageData } = $props();

	let currentPage = $state(1);
	const pageSize = 10;
	let searchQuery = $state('');

	const today = new Date();
	const y = today.getFullYear();
	const m = String(today.getMonth() + 1).padStart(2, '0');
	const d = String(today.getDate()).padStart(2, '0');
	const todayStr = `${y}-${m}-${d}`;

	// Filters
	let summaryDate = $state(todayStr);
	let filterStatus = $state('all');
	let filterSourceCuid = $state('all');
	let filterPeriod = $state<'week' | 'month' | 'overall'>('month');

	const filterPeriodOptions: { value: 'week' | 'month' | 'overall'; label: string }[] = [
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' },
		{ value: 'overall', label: 'Overall' }
	];

	// Sorting
	let sortKey = $state<string | null>('employee_name');
	let sortDirection = $state<'asc' | 'desc' | null>('asc');

	// Modal States
	let isFormModalOpen = $state(false);
	let isSubmitting = $state(false);

	// Record to Edit
	let editCuid = $state<string | null>(null);

	// Form local state
	let formEmployeeCuid = $state('');
	let formAttendanceDate = $state('');
	let formCheckInTime = $state('');
	let formCheckOutTime = $state('');
	let formAttendanceStatus = $state('');
	let formAttendanceSourceCuid = $state('');
	let formRemarks = $state('');

	let errors = $state<Record<string, string>>({});


	// New Form states for smart save & custom datepicker
	let formCheckInTimeOnly = $state('');
	let formCheckOutTimeOnly = $state('');
	let empSearchQuery = $state('');

	let pendingNavigation = $state<import('@sveltejs/kit').Navigation | null>(null);
	let isNavigatingProgrammatically = $state(false);

	// Attendance Source and Status dropdown states
	let localSources = $state<any[]>([]);
	let isSourceDropdownOpen = $state(false);
	let sourceContainer = $state<HTMLDivElement | null>(null);
	let sourceSearchQuery = $state('');
	let isAddSourceModalOpen = $state(false);
	let newSourceName = $state('');
	let newSourceError = $state('');
	let isSavingNewSource = $state(false);

	$effect(() => {
		if (data.sources) {
			localSources = [...data.sources];
		}
	});

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (sourceContainer && !sourceContainer.contains(event.target as Node)) {
				isSourceDropdownOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside, { capture: true });
		return () => {
			document.removeEventListener('click', handleClickOutside, { capture: true });
		};
	});

	let filteredSourceOptions = $derived.by(() => {
		const query = sourceSearchQuery.toLowerCase().trim();
		if (!query) return modalSourceOptions;
		return modalSourceOptions.filter((opt) => opt.label.toLowerCase().includes(query));
	});

	// Dropdown Options
	const statusOptions = [
		{ value: 'Present', label: 'Present' },
		{ value: 'Leave', label: 'Leave' },
		{ value: 'LOP', label: 'LOP' },
		{ value: 'Week Off', label: 'Week Off' },
		{ value: 'Half Day', label: 'Half Day' },
		{ value: 'WFH', label: 'WFH' }
	];

	const modalStatusOptions = statusOptions.filter((opt) => opt.value !== 'Week Off');

	let employeeFormOptions = $derived(
		data.employees.map((emp: any) => ({
			id: emp.uuid,
			label: `${emp.name} (${emp.emp_code})`
		}))
	);

	let filteredEmployeeFormOptions = $derived.by(() => {
		const q = empSearchQuery.toLowerCase().trim();
		if (!q) return employeeFormOptions;
		return employeeFormOptions.filter(o => o.label.toLowerCase().includes(q));
	});

	let statusFilterOptions = [
		{ value: 'all', label: 'All Status' },
		...statusOptions.filter((opt) => opt.value !== 'Week Off'),
		{ value: 'Not Logged In', label: 'Not Logged In' }
	];

	let sourceFilterOptions = $derived([
		{ value: 'all', label: 'All Sources' },
		...data.sources.map((src: any) => ({
			value: src.id,
			label: src.label
		}))
	]);

	let modalSourceOptions = $derived(
		localSources.map(src => ({ id: src.id, label: src.label }))
	);

	let activeHoliday = $derived(
		data.holidays.find((h: any) => getISODateString(h.date) === summaryDate)
	);

	let editingRecord = $derived(data.records.find((r: any) => r.cuid === editCuid));

	let hasChanges = $derived.by(() => {
		if (!editCuid || !editingRecord) return false;

		const originalCheckIn = editingRecord.check_in_time
			? new Date(new Date(editingRecord.check_in_time).getTime() - new Date(editingRecord.check_in_time).getTimezoneOffset() * 60000).toISOString()
			: '';
		const originalCheckInTime = originalCheckIn ? originalCheckIn.slice(11, 16) : '';

		const originalCheckOut = editingRecord.check_out_time
			? new Date(new Date(editingRecord.check_out_time).getTime() - new Date(editingRecord.check_out_time).getTimezoneOffset() * 60000).toISOString()
			: '';
		const originalCheckOutTime = originalCheckOut ? originalCheckOut.slice(11, 16) : '';

		const originalRemarks = editingRecord.remarks || '';
		const originalSource = editingRecord.attendance_source_cuid || '';

		return (
			formEmployeeCuid !== editingRecord.employee_cuid ||
			formAttendanceDate !== editingRecord.date ||
			formCheckInTimeOnly !== originalCheckInTime ||
			formCheckOutTimeOnly !== originalCheckOutTime ||
			formAttendanceStatus !== editingRecord.status ||
			formAttendanceSourceCuid !== originalSource ||
			formRemarks.trim() !== originalRemarks.trim()
		);
	});

	let hasUnsavedChanges = $derived.by(() => {
		if (editCuid) {
			return hasChanges;
		} else {
			return (
				formEmployeeCuid !== '' ||
				formAttendanceDate !== '' ||
				formCheckInTimeOnly !== '' ||
				formCheckOutTimeOnly !== '' ||
				formAttendanceStatus !== '' ||
				formAttendanceSourceCuid !== '' ||
				formRemarks.trim() !== ''
			);
		}
	});

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;

		const mandatoryFieldsFilled =
			formEmployeeCuid.trim() !== '' &&
			formAttendanceDate.trim() !== '' &&
			formAttendanceStatus.trim() !== '';

		if (!mandatoryFieldsFilled) return true;

		let checkOutDate = formAttendanceDate;
		if (formCheckInTimeOnly && formCheckOutTimeOnly && formCheckOutTimeOnly < formCheckInTimeOnly) {
			const baseDate = new Date(formAttendanceDate);
			const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			checkOutDate = `${year}-${month}-${day}`;
		}

		const checkInDateTimeStr = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : '';
		const checkOutDateTimeStr = checkOutDate && formCheckOutTimeOnly ? `${checkOutDate}T${formCheckOutTimeOnly}` : '';

		if (checkInDateTimeStr && checkOutDateTimeStr) {
			const checkIn = new Date(checkInDateTimeStr);
			const checkOut = new Date(checkOutDateTimeStr);
			if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut < checkIn) {
				return true;
			}
		}

		if (editCuid) {
			return !hasChanges;
		}

		return false;
	});



	// Reset form state on modal close
	$effect(() => {
		if (!isFormModalOpen) {
			isSubmitting = false;
			formEmployeeCuid = '';
			formAttendanceDate = '';
			formCheckInTimeOnly = '';
			formCheckOutTimeOnly = '';
			formAttendanceStatus = '';
			formAttendanceSourceCuid = '';
			formRemarks = '';
			errors = {};
			validationState.reset();
			editCuid = null;

			isSourceDropdownOpen = false;
			sourceSearchQuery = '';
			newSourceName = '';
			newSourceError = '';
			isAddSourceModalOpen = false;
		}
	});

	// Clear times and source when non-working status is selected
	$effect(() => {
		if (['Leave', 'Holiday', 'LOP'].includes(formAttendanceStatus)) {
			formCheckInTimeOnly = '';
			formCheckOutTimeOnly = '';
			formAttendanceSourceCuid = '';
		}
	});

	// Formatters
	function formatDate(dateString: string | Date): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
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

	function getEmployeeName(uuid: string): string {
		const emp = data.employees.find((e: any) => e.uuid === uuid);
		return emp ? emp.name : 'Unknown';
	}

	function getEmployeeCode(uuid: string): string {
		const emp = data.employees.find((e: any) => e.uuid === uuid);
		return emp ? emp.emp_code : '--';
	}

	function getSourceName(cuid: string | null): string {
		if (!cuid) return '--';
		const src = data.sources.find((s: any) => s.id === cuid);
		return src ? src.label : cuid;
	}

	// Status badge mapping
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

	// Local validation
	function getISODateString(dateInput: string | Date): string {
		const d = new Date(dateInput);
		const year = d.getUTCFullYear();
		const month = String(d.getUTCMonth() + 1).padStart(2, '0');
		const day = String(d.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getFormErrors() {
		const errs: Record<string, string> = {};
		if (!formEmployeeCuid) errs.employee_cuid = 'Employee is required';
		
		if (!formAttendanceDate) {
			errs.date = 'Attendance date is required';
		} else {
			// Holiday check
			const isHoliday = data.holidays.some((h: any) => getISODateString(h.date) === formAttendanceDate);
			if (isHoliday) {
				errs.date = 'Attendance cannot be marked on holidays';
			}

			// Duplicate check
			if (formEmployeeCuid) {
				const existing = data.records.find(
					(rec: any) =>
						rec.employee_cuid === formEmployeeCuid &&
						(rec.date || rec.attendance_date) === formAttendanceDate
				);
				if (existing && existing.status !== 'Half Day' && (!editCuid || existing.cuid !== editCuid)) {
					errs.date = 'An attendance record already exists for this employee on this date';
				}
			}

			// Leave check
			if (formEmployeeCuid && formAttendanceStatus && ['Present', 'Late', 'WFH', 'Half Day'].includes(formAttendanceStatus)) {
				const existing = data.records.find(
					(rec: any) =>
						rec.employee_cuid === formEmployeeCuid &&
						(rec.date || rec.attendance_date) === formAttendanceDate
				);
				if (existing && (existing.status === 'Leave' || existing.status === 'LOP') && (!editCuid || existing.cuid === editCuid)) {
					errs.date = 'Attendance cannot be marked on leave or LOP days';
				}
			}

			// Join and Relieving Date check
			if (formEmployeeCuid) {
				const emp = data.employees.find((e: any) => e.uuid === formEmployeeCuid);
				if (emp) {
					const joinStr = emp.date_of_joining ? getISODateString(emp.date_of_joining) : null;
					const relieveStr = emp.relieving_date ? getISODateString(emp.relieving_date) : null;

					if (joinStr && formAttendanceDate < joinStr) {
						errs.date = "Attendance date must be within employee's employment period.";
					} else if (relieveStr && formAttendanceDate > relieveStr) {
						errs.date = "Attendance date must be within employee's employment period.";
					}
				}
			}
		}

		if (!formAttendanceStatus) errs.status = 'Attendance status is required';

		let checkOutDate = formAttendanceDate;
		if (formCheckInTimeOnly && formCheckOutTimeOnly && formCheckOutTimeOnly < formCheckInTimeOnly) {
			const baseDate = new Date(formAttendanceDate);
			const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			checkOutDate = `${year}-${month}-${day}`;
		}

		const checkInDateTimeStr = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : '';
		const checkOutDateTimeStr = checkOutDate && formCheckOutTimeOnly ? `${checkOutDate}T${formCheckOutTimeOnly}` : '';

		if (checkInDateTimeStr && checkOutDateTimeStr) {
			const checkIn = new Date(checkInDateTimeStr);
			const checkOut = new Date(checkOutDateTimeStr);
			if (checkOut < checkIn) {
				errs.check_out_time = 'Check out time cannot be before check in time';
			}
		}
		return errs;
	}

	let realTimeErrors = $derived(getFormErrors());

	// CRUD Ops
	function openAddModal() {
		editCuid = null;
		formEmployeeCuid = '';
		formAttendanceDate = ''; // reset to empty/blank state instead of pre-filling summaryDate
		formCheckInTimeOnly = '';
		formCheckOutTimeOnly = '';
		formAttendanceStatus = '';
		formAttendanceSourceCuid = '';
		formRemarks = '';
		errors = {};
		validationState.reset();
		isFormModalOpen = true;

		isSourceDropdownOpen = false;
		sourceSearchQuery = '';
		newSourceName = '';
		newSourceError = '';
	}

	// Opens the Create modal pre-filled with the employee + date from a virtual row
	function openAddModalForVirtualRow(rec: any) {
		editCuid = null;
		formEmployeeCuid = rec.employee_cuid;
		formAttendanceDate = rec.date;
		formCheckInTimeOnly = '';
		formCheckOutTimeOnly = '';
		formAttendanceStatus = '';
		formAttendanceSourceCuid = '';
		formRemarks = '';
		errors = {};
		validationState.reset();
		isFormModalOpen = true;

		isSourceDropdownOpen = false;
		sourceSearchQuery = '';
		newSourceName = '';
		newSourceError = '';
	}

	function openEditModal(record: any) {
		editCuid = record.cuid;
		formEmployeeCuid = record.employee_cuid;
		formAttendanceDate = record.date;
		
		if (record.check_in_time) {
			const d = new Date(record.check_in_time);
			const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
			formCheckInTimeOnly = localISO.slice(11, 16);
		} else {
			formCheckInTimeOnly = '';
		}

		if (record.check_out_time) {
			const d = new Date(record.check_out_time);
			const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
			formCheckOutTimeOnly = localISO.slice(11, 16);
		} else {
			formCheckOutTimeOnly = '';
		}

		formAttendanceStatus = record.status;
		formAttendanceSourceCuid = record.attendance_source_cuid || '';
		formRemarks = record.remarks || '';
		errors = {};
		validationState.reset();
		isFormModalOpen = true;

		isSourceDropdownOpen = false;
		sourceSearchQuery = '';
		newSourceName = '';
		newSourceError = '';
	}

	import { createValidationState } from '$lib/utils';
	const validationState = createValidationState();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		validationState.markAttempted();

		const formErrors = getFormErrors();
		if (Object.keys(formErrors).length > 0) {
			errors = formErrors;
			return;
		}

		isSubmitting = true;

		let checkOutDate = formAttendanceDate;
		if (formCheckInTimeOnly && formCheckOutTimeOnly && formCheckOutTimeOnly < formCheckInTimeOnly) {
			const baseDate = new Date(formAttendanceDate);
			const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			checkOutDate = `${year}-${month}-${day}`;
		}

		const checkInISO = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : null;
		const checkOutISO = checkOutDate && formCheckOutTimeOnly ? `${checkOutDate}T${formCheckOutTimeOnly}` : null;

		const payload = {
			employee_cuid: formEmployeeCuid,
			date: formAttendanceDate,
			check_in_time: checkInISO ? new Date(checkInISO).toISOString() : null,
			check_out_time: checkOutISO ? new Date(checkOutISO).toISOString() : null,
			status: formAttendanceStatus,
			attendance_source_cuid: formAttendanceSourceCuid || null,
			remarks: formRemarks || null
		};

		try {
			const url = editCuid ? `/api/attendance-records/${editCuid}` : '/api/attendance-records';
			const res = await fetch(url, {
				method: editCuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const body = await res.json();

			if (res.ok) {
				toast.success(body.data?.message || 'Attendance record saved');
				const createdDate = formAttendanceDate;
				const isCreate = !editCuid;
				isFormModalOpen = false;
				if (isCreate && createdDate) {
					summaryDate = createdDate;
				}
				await invalidate('/api/attendance-records');
			} else {
				if (body.data?.error && typeof body.data.error === 'object') {
					errors = body.data.error;
				} else {
					toast.error(body.data?.error || 'Action failed');
				}
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred');
		} finally {
			isSubmitting = false;
		}
	}


	function handleSort(key: string) {
		currentPage = 1;
		if (sortKey !== key) {
			sortKey = key;
			sortDirection = 'asc';
		} else if (sortDirection === 'asc') {
			sortDirection = 'desc';
		} else {
			sortKey = null;
			sortDirection = null;
		}
	}
	function parseLocalDate(dateStr: string): Date {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	function isInCurrentWeek(dateStr: string, todayStr: string): boolean {
		const date = parseLocalDate(dateStr);
		const today = parseLocalDate(todayStr);

		const todayDay = today.getDay();
		const diffToMonday = todayDay === 0 ? -6 : 1 - todayDay;
		const mondayOfTodayWeek = new SvelteDate(today.getTime());
		mondayOfTodayWeek.setDate(today.getDate() + diffToMonday);
		mondayOfTodayWeek.setHours(0, 0, 0, 0);

		const sundayOfTodayWeek = new SvelteDate(mondayOfTodayWeek.getTime());
		sundayOfTodayWeek.setDate(mondayOfTodayWeek.getDate() + 6);
		sundayOfTodayWeek.setHours(23, 59, 59, 999);

		const recordDate = new SvelteDate(date.getTime());
		recordDate.setHours(0, 0, 0, 0);

		return recordDate >= mondayOfTodayWeek && recordDate <= sundayOfTodayWeek;
	}

	function isInCurrentMonth(dateStr: string, targetDateStr: string): boolean {
		const [rYear, rMonth] = dateStr.split('-');
		const [tYear, tMonth] = targetDateStr.split('-');
		return rYear === tYear && rMonth === tMonth;
	}

	let employeesBelowMinHours = $derived.by(() => {
		const resultList: { name: string; emp_code: string; avgHours: string }[] = [];

		for (const emp of data.employees) {
			if (emp.minimum_work_hours === undefined || emp.minimum_work_hours === null) {
				continue;
			}

			const empRecords = data.records.filter((r: any) => r.employee_cuid === emp.uuid);

			let totalMinutes = 0;
			let totalWorkingDays = 0;

			for (const r of empRecords) {
				if (!r.date) continue;
				if (r.date > todayStr) continue;

				// Apply period filter
				if (filterPeriod === 'week') {
					if (!isInCurrentWeek(r.date, todayStr)) continue;
				} else if (filterPeriod === 'month') {
					if (!isInCurrentMonth(r.date, todayStr)) continue;
				}

				const dateObj = parseLocalDate(r.date);
				const dayOfWeek = dateObj.getDay();
				if (dayOfWeek === 0 || dayOfWeek === 6) {
					continue;
				}

				const isHoliday = data.holidays.some((h: any) => getISODateString(h.date) === r.date);
				if (isHoliday) {
					continue;
				}

				const status = r.status;
				if (status === 'Leave' || status === 'On Leave' || status === 'LOP') {
					continue;
				}

				if (!r.check_out_time || r.work_duration_minutes === null || r.work_duration_minutes === undefined) {
					continue;
				}

				const duration = r.work_duration_minutes;
				if (duration !== null && duration !== undefined && duration >= 0) {
					totalMinutes += duration;
				}

				if (status === 'Present' || status === 'Late' || status === 'WFH') {
					totalWorkingDays += 1;
				} else if (status === 'Half Day') {
					totalWorkingDays += 0.5;
				}
			}

			if (totalWorkingDays > 0) {
				const avgMinutes = Math.round(totalMinutes / totalWorkingDays);
				const avgHoursDecimal = avgMinutes / 60;
				if (avgHoursDecimal < Number(emp.minimum_work_hours)) {
					const hrs = Math.floor(avgMinutes / 60);
					const mins = avgMinutes % 60;
					resultList.push({
						name: `${emp.first_name} ${emp.last_name}`,
						emp_code: emp.emp_code,
						avgHours: `${hrs}h ${String(mins).padStart(2, '0')}m`
					});
				}
			}
		}

		return resultList;
	});

	let summaryCounts = $derived.by(() => {
		const recordsForDate = data.records.filter((rec) => rec.date === summaryDate);
		const present = recordsForDate.filter((rec) => rec.status === 'Present').length;
		const leave = recordsForDate.filter((rec) => rec.status === 'Leave' || rec.status === 'On Leave').length;
		const wfh = recordsForDate.filter((rec) => rec.status === 'WFH').length;
		const halfDay = recordsForDate.filter((rec) => rec.status === 'Half Day').length;
		const lop = recordsForDate.filter((rec) => rec.status === 'LOP').length;
		
		const loggedInCuids = new Set(recordsForDate.map((rec) => rec.employee_cuid));
		const activeEmployeesForDate = data.employees.filter((emp) => {
			const joinStr = emp.date_of_joining ? getISODateString(emp.date_of_joining) : null;
			const relieveStr = emp.relieving_date ? getISODateString(emp.relieving_date) : null;
			return joinStr && (summaryDate >= joinStr) && (!relieveStr || summaryDate <= relieveStr);
		});
		const notLoggedIn = activeHoliday ? 0 : activeEmployeesForDate.filter((emp) => !loggedInCuids.has(emp.uuid)).length;

		return {
			total: activeEmployeesForDate.length,
			present,
			leave,
			wfh,
			halfDay,
			lop,
			notLoggedIn
		};
	});

	// Derived filtering & sorting logic
	let filteredRecords = $derived.by(() => {
		const allEmployees = data.employees;
		const recordsForDate = data.records.filter((rec) => rec.date === summaryDate);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const recordMap = new Map<string, any>();
		for (const rec of recordsForDate) {
			recordMap.set(rec.employee_cuid, rec);
		}

		const list: any[] = [];
		for (const emp of allEmployees) {
			const existingRecord = recordMap.get(emp.uuid);
			if (existingRecord) {
				list.push(existingRecord);
			} else {
				// Only generate virtual record if summaryDate is within employment range
				const joinStr = emp.date_of_joining ? getISODateString(emp.date_of_joining) : null;
				const relieveStr = emp.relieving_date ? getISODateString(emp.relieving_date) : null;
				
				if (joinStr && (summaryDate >= joinStr) && (!relieveStr || summaryDate <= relieveStr)) {
					// Virtual "Not Logged In" or "Holiday" record
					list.push({
						cuid: `virtual-${emp.uuid}-${summaryDate}`,
						employee_cuid: emp.uuid,
						date: summaryDate,
						check_in_time: null,
						check_out_time: null,
						work_duration_minutes: null,
						status: activeHoliday ? 'Holiday' : 'Not Logged In',
						attendance_source_cuid: null,
						remarks: null,
						isVirtual: true
					});
				}
			}
		}

		let result = list;

		// Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter((rec) =>
				getEmployeeName(rec.employee_cuid).toLowerCase().includes(q)
			);
		}

		// Filters
		if (filterStatus !== 'all') {
			if (filterStatus === 'LOP') {
				result = result.filter(
					(rec) => rec.status === 'LOP'
				);
			} else if (filterStatus === 'Leave') {
				result = result.filter(
					(rec) => rec.status === 'Leave' || rec.status === 'On Leave'
				);
			} else {
				result = result.filter((rec) => rec.status === filterStatus);
			}
		}

		if (filterSourceCuid !== 'all') {
			result = result.filter((rec) => rec.attendance_source_cuid === filterSourceCuid);
		}

		// Sorting
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				if (sortKey === 'employee_name') {
					const valA = getEmployeeName(a.employee_cuid);
					const valB = getEmployeeName(b.employee_cuid);
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}

				if (sortKey === 'employee_code') {
					const valA = getEmployeeCode(a.employee_cuid);
					const valB = getEmployeeCode(b.employee_cuid);
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}

				if (sortKey === 'check_in_time' || sortKey === 'check_out_time') {
					const valA = a[sortKey as keyof typeof a];
					const valB = b[sortKey as keyof typeof b];
					const timeA = valA ? new Date(valA as string).getTime() : 0;
					const timeB = valB ? new Date(valB as string).getTime() : 0;
					return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
				}

				if (sortKey === 'work_duration_minutes') {
					const valA = a.work_duration_minutes || 0;
					const valB = b.work_duration_minutes || 0;
					return sortDirection === 'asc' ? valA - valB : valB - valA;
				}

				// fallback (e.g. status)
				const valA = a[sortKey as keyof typeof a];
				const valB = b[sortKey as keyof typeof b];

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}

				if (valA === null || valA === undefined) return 1;
				if (valB === null || valB === undefined) return -1;

				if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
				if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return result;
	});

	let paginatedRecords = $derived(
		filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => {
		// Reset page on search or filter change
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		searchQuery;
		summaryDate;
		filterStatus;
		filterSourceCuid;
		filterPeriod;
		/* eslint-enable @typescript-eslint/no-unused-expressions */
		currentPage = 1;
	});

	async function handleAddAttendanceSource(e: Event) {
		e.preventDefault();
		const trimmed = newSourceName.trim();
		if (!trimmed) {
			newSourceError = 'Attendance Source name is required';
			return;
		}
		if (trimmed.length > 100) {
			newSourceError = 'Attendance Source name cannot exceed 100 characters';
			return;
		}
		if (!/^[A-Za-z0-9 ]+$/.test(trimmed)) {
			newSourceError = 'Attendance Source name must contain only letters, numbers, and spaces';
			return;
		}

		isSavingNewSource = true;
		newSourceError = '';
		try {
			const res = await fetch('/api/master-data/attendance-sources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed })
			});
			const result = await res.json();
			if (res.ok && result.data) {
				toast.success(result.data.message || 'Attendance Source created successfully');
				
				const newSource = {
					id: result.data.cuid,
					label: trimmed
				};

				localSources = [...localSources, newSource];
				formAttendanceSourceCuid = result.data.cuid;

				newSourceName = '';
				isAddSourceModalOpen = false;
			} else {
				newSourceError = result.error || 'Failed to create Attendance Source';
			}
		} catch (err) {
			console.error('Failed to create Attendance Source:', err);
			newSourceError = 'An unexpected error occurred';
		} finally {
			isSavingNewSource = false;
		}
	}
</script>

<svelte:head>
	<title>Attendance Records</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Attendance Records</h1>
		</div>
		<Button
			type="button"
			class="bg-hrms-primary text-white hover:bg-hrms-primary/90 border-0 font-semibold"
			onclick={openAddModal}
		>
			Add Record
		</Button>
	</div>

	<!-- Summary Cards Section -->
	{#if !activeHoliday}
		<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
			<!-- Total Employees Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total</CardDescription>
					<CardTitle class="text-2xl font-bold text-foreground mt-1 tabular-nums">{summaryCounts.total}</CardTitle>
				</CardHeader>
			</Card>
			
			<!-- Present Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Present</CardDescription>
					<CardTitle class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{summaryCounts.present}</CardTitle>
				</CardHeader>
			</Card>

			<!-- Leave Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Leave</CardDescription>
					<CardTitle class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{summaryCounts.leave}</CardTitle>
				</CardHeader>
			</Card>

			<!-- WFH Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>WFH</CardDescription>
					<CardTitle class="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1 tabular-nums">{summaryCounts.wfh}</CardTitle>
				</CardHeader>
			</Card>

			<!-- Half Day Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Half Day</CardDescription>
					<CardTitle class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">{summaryCounts.halfDay}</CardTitle>
				</CardHeader>
			</Card>

			<!-- LOP Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>LOP</CardDescription>
					<CardTitle class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">{summaryCounts.lop}</CardTitle>
				</CardHeader>
			</Card>

			<!-- Not Logged In Card -->
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Not Logged In</CardDescription>
					<CardTitle class="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-1 tabular-nums">{summaryCounts.notLoggedIn}</CardTitle>
				</CardHeader>
			</Card>
		</div>
	{/if}

	{#if activeHoliday}
		<div class="flex items-center gap-4 p-4 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 rounded-xl text-blue-950 dark:text-blue-50 shadow-xs mb-6">
			<span class="text-xl">🎉</span>
			<div>
				<h4 class="font-bold text-base">Today is {activeHoliday.name}</h4>
				<p class="text-sm opacity-90">Attendance logging is not required for this holiday</p>
			</div>
		</div>
	{/if}


	<!-- Filters & Search -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
			<SearchInput id="search_attendance_records" name="search_attendance_records" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by employee name..." />

			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
				<!-- Date Filter -->
				<div class="w-full">
					<DatePicker
						placeholder="Filter Date"
						bind:value={summaryDate}
						isFilter={true}
					/>
				</div>

				<!-- Period Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{filterPeriodOptions.find(o => o.value === filterPeriod)?.label || 'Period'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
						<DropdownMenu.Group>
							{#each filterPeriodOptions as opt}
								<DropdownMenu.Item onclick={() => filterPeriod = opt.value} class="justify-between cursor-pointer {filterPeriod === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span>{opt.label}</span>
									{#if filterPeriod === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Status Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{statusFilterOptions.find(o => o.value === filterStatus)?.label || 'Status'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
						<DropdownMenu.Group>
							{#each statusFilterOptions as opt}
								<DropdownMenu.Item onclick={() => filterStatus = opt.value} class="justify-between cursor-pointer {filterStatus === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span>{opt.label}</span>
									{#if filterStatus === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Source Filter -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-1">
									{sourceFilterOptions.find(o => o.value === filterSourceCuid)?.label || 'Source'}
								</span>
								<FilterIcon class="size-3.5 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each sourceFilterOptions as opt}
								<DropdownMenu.Item onclick={() => filterSourceCuid = opt.value} class="justify-between cursor-pointer {filterSourceCuid === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}">
									<span class="truncate">{opt.label}</span>
									{#if filterSourceCuid === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!-- Table Card -->
		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('employee_name')}>
								Employee
								{#if sortKey === 'employee_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('employee_code')}>
								Code
								{#if sortKey === 'employee_code' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'employee_code' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Date</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('check_in_time')}>
								Check In
								{#if sortKey === 'check_in_time' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'check_in_time' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('check_out_time')}>
								Check Out
								{#if sortKey === 'check_out_time' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'check_out_time' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('work_duration_minutes')}>
								Work Duration
								{#if sortKey === 'work_duration_minutes' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'work_duration_minutes' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
								Status
								{#if sortKey === 'status' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'status' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">Source</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredRecords.length === 0}
						<TableRow>
							<TableCell colspan={9} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedRecords as rec (rec.cuid)}
							<TableRow 
								class="cursor-pointer"
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									if (rec.isVirtual) {
										openAddModalForVirtualRow(rec);
									} else {
										openEditModal(rec);
									}
								}}
							>
								<TableCell class="font-semibold">{getEmployeeName(rec.employee_cuid)}</TableCell>
								<TableCell>{getEmployeeCode(rec.employee_cuid)}</TableCell>
								<TableCell>{formatDate(rec.date)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_in_time)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_out_time)}</TableCell>
								<TableCell>{formatDuration(rec.work_duration_minutes)}</TableCell>
								<TableCell>
									<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(rec.status)}`}>
										{rec.status}
									</Badge>
								</TableCell>
								<TableCell>{getSourceName(rec.attendance_source_cuid)}</TableCell>
								<TableCell class="text-right">
									{#if !rec.isVirtual}
										<TableActions
											canEdit={true}
											onEdit={() => openEditModal(rec)}
										/>
									{:else}
										<TableActions
											canEdit={true}
											editLabel="Add Record"
											onEdit={() => openAddModalForVirtualRow(rec)}
										/>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination totalItems={filteredRecords.length} bind:currentPage={currentPage} pageSize={pageSize} />

		<!-- Employees working below minimum hours warning section -->
		{#if employeesBelowMinHours.length > 0}
			<Card class="border-destructive/30 shadow-xs mt-6 bg-destructive/5 dark:bg-destructive/10">
				<CardHeader class="pb-2">
					<CardTitle class="text-lg font-bold text-destructive flex items-center gap-2">
						⚠️ Employees Working Below Required Hours
					</CardTitle>
					<CardDescription class="text-destructive/80 dark:text-destructive/90 text-xs">
						The following employees have average working hours below the minimum required for their assigned shifts.
					</CardDescription>
				</CardHeader>
				<CardContent class="pt-0">
					<div class="border rounded-md divide-y divide-border bg-background">
						{#each employeesBelowMinHours as emp}
							<div class="flex items-center justify-between p-3 text-sm hover:bg-muted/40 transition-colors">
								<div class="flex flex-col">
									<span class="font-semibold text-foreground">{emp.name}</span>
									<span class="text-xs text-muted-foreground">Code: {emp.emp_code}</span>
								</div>
								<div class="text-right">
									<span class="text-xs font-medium text-muted-foreground block">Average Working Hours</span>
									<span class="text-sm font-bold text-destructive">{emp.avgHours}</span>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<!-- Add/Edit Modal -->
<CrudModal
	open={isFormModalOpen}
	title={editCuid ? 'Edit Attendance Record' : 'Create Attendance Record'}
	hasUnsavedChanges={hasUnsavedChanges}
	onClose={() => (isFormModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			<!-- Employee Selector -->
			<div class="space-y-2 flex flex-col">
				<Label class={validationState.shouldShowError('employee_cuid', realTimeErrors.employee_cuid) ? 'text-destructive font-semibold' : ''}>Employee <span class="text-destructive font-bold">*</span></Label>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button onblur={() => validationState.markTouched('employee_cuid')} variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none {validationState.shouldShowError('employee_cuid', realTimeErrors.employee_cuid) || errors.employee_cuid ? 'border-destructive' : ''} {editCuid ? 'opacity-60 pointer-events-none' : ''}" {...props}>
								<span class="truncate pr-2">
									{formEmployeeCuid ? (employeeFormOptions.find(o => o.id === formEmployeeCuid)?.label || 'Select Employee') : 'Select Employee'}
								</span>
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) max-h-60 overflow-y-auto">
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
							{#each filteredEmployeeFormOptions as opt}
								<DropdownMenu.Item
									onclick={() => {
										formEmployeeCuid = opt.id;
										errors.employee_cuid = '';
										empSearchQuery = '';
									}}
									class="justify-between cursor-pointer {formEmployeeCuid === opt.id ? 'bg-accent text-accent-foreground font-semibold' : ''}"
								>
									<span class="truncate">{opt.label}</span>
									{#if formEmployeeCuid === opt.id}
										<CheckIcon class="size-4 shrink-0 text-hrms-primary" />
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
				{#if validationState.shouldShowError('employee_cuid', realTimeErrors.employee_cuid) || errors.employee_cuid}
					<p class="text-xs font-semibold text-destructive mt-0.5">{validationState.shouldShowError('employee_cuid', realTimeErrors.employee_cuid) || errors.employee_cuid}</p>
				{/if}
			</div>

			<!-- Date Selector -->
			<div class="space-y-2 flex flex-col">
				<Label for="modal_date" class={validationState.shouldShowError('date', realTimeErrors.date) ? 'text-destructive font-semibold' : ''}>Attendance Date <span class="text-destructive font-bold">*</span></Label>
				{#if editCuid}
					<div class="h-9 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground select-none">
						{formAttendanceDate ? formatDate(formAttendanceDate) : '--'}
					</div>
				{:else}
					<DatePicker
						id="modal_date"
						name="date"
						bind:value={formAttendanceDate}
						onBlur={() => validationState.markTouched('date')}
						onchange={() => {
							errors.date = '';
						}}
						required={true}
						isError={validationState.shouldShowError('date', realTimeErrors.date) || !!errors.date}
						class={validationState.shouldShowError('date', realTimeErrors.date) || errors.date ? 'border-destructive focus-visible:ring-destructive/30' : ''}
						disabled={!!editCuid}
					/>
				{/if}
			</div>

			<!-- Check-In and Check-Out Time Row -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2 flex flex-col">
					<Label for="modal_check_in_time" class={validationState.shouldShowError('check_in_time', realTimeErrors.check_in_time) ? 'text-destructive font-semibold' : ''}>Check In Time</Label>
					<TimePicker
						id="modal_check_in_time"
						bind:value={formCheckInTimeOnly}
						error={validationState.shouldShowError('check_in_time', realTimeErrors.check_in_time) ? (realTimeErrors.check_in_time || errors.check_in_time) : errors.check_in_time}
						onBlur={() => validationState.markTouched('check_in_time')}
						disabled={['Leave', 'Holiday', 'LOP'].includes(formAttendanceStatus)}
						onChange={() => {
							errors.check_in_time = '';
							errors.check_out_time = '';
						}}
					/>
				</div>
				<div class="space-y-2 flex flex-col">
					<Label for="modal_check_out_time" class={validationState.shouldShowError('check_out_time', realTimeErrors.check_out_time) ? 'text-destructive font-semibold' : ''}>Check Out Time</Label>
					<TimePicker
						id="modal_check_out_time"
						bind:value={formCheckOutTimeOnly}
						error={validationState.shouldShowError('check_out_time', realTimeErrors.check_out_time) ? (realTimeErrors.check_out_time || errors.check_out_time) : errors.check_out_time}
						onBlur={() => validationState.markTouched('check_out_time')}
						disabled={['Leave', 'Holiday', 'LOP'].includes(formAttendanceStatus)}
						onChange={() => {
							errors.check_in_time = '';
							errors.check_out_time = '';
						}}
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Status Selector -->
				<div class="space-y-2 flex flex-col">
					<Label for="modal_status" class={validationState.shouldShowError('status', realTimeErrors.status) ? 'text-destructive font-semibold' : ''}>Status <span class="text-destructive font-bold">*</span></Label>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button onblur={() => validationState.markTouched('status')} variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none {validationState.shouldShowError('status', realTimeErrors.status) || errors.status ? 'border-destructive' : ''}" {...props}>
									<span class="truncate pr-2">
										{formAttendanceStatus ? (statusOptions.find(o => o.value === formAttendanceStatus)?.label || 'Select Status') : 'Select Status'}
									</span>
									<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) max-h-60 overflow-y-auto">
							<DropdownMenu.Group>
								{#each modalStatusOptions as opt}
									<DropdownMenu.Item
										onclick={() => {
											formAttendanceStatus = opt.value;
											errors.status = '';
										}}
										class="justify-between cursor-pointer {formAttendanceStatus === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}"
									>
										<span class="truncate pr-2">{opt.label}</span>
										{#if formAttendanceStatus === opt.value}
											<CheckIcon class="size-4 shrink-0 text-hrms-primary" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					{#if validationState.shouldShowError('status', realTimeErrors.status) || errors.status}
						<p class="text-xs font-semibold text-destructive mt-0.5">{validationState.shouldShowError('status', realTimeErrors.status) || errors.status}</p>
					{/if}
				</div>

				<!-- Source Selector -->
				<div class="space-y-2 flex flex-col" bind:this={sourceContainer}>
					<Label for="modal_source">Attendance Source</Label>
					<div class="relative w-full">
						<input type="hidden" name="attendance_source_cuid" value={formAttendanceSourceCuid} />
						
						<!-- Input Trigger Box -->
						<button
							type="button"
							onclick={() => (isSourceDropdownOpen = !isSourceDropdownOpen)}
							onkeydown={(e) => {
								if (e.key === 'Escape') {
									isSourceDropdownOpen = false;
								}
							}}
							class="flex items-center justify-between w-full h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow] hover:bg-accent/30 focus:border-ring focus:ring-ring/50 focus:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none cursor-pointer select-none text-left disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 {isSourceDropdownOpen ? 'border-ring ring-ring/50 ring-3' : ''}"
							disabled={['Leave', 'Holiday', 'LOP'].includes(formAttendanceStatus)}
						>
							<div class="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 pr-2">
								{#if !formAttendanceSourceCuid}
									<span class="text-muted-foreground truncate select-none">Select Source</span>
								{:else}
									<span class="truncate pr-2">
										{modalSourceOptions.find(o => o.id === formAttendanceSourceCuid)?.label || 'Select Source'}
									</span>
								{/if}
							</div>

							<div class="flex items-center gap-1 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-muted-foreground transition-transform duration-200 {isSourceDropdownOpen ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
							</div>
						</button>

						<!-- Dropdown Panel -->
						{#if isSourceDropdownOpen}
							<div
								transition:slide={{ duration: 150 }}
								class="absolute left-0 z-50 mt-1 w-full min-w-[120px] origin-top-right rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-hidden flex flex-col overflow-hidden py-1"
							>
								<!-- Search bar inside dropdown -->
								<div class="flex items-center border-b border-border px-3 py-2 bg-transparent">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-2 size-4 shrink-0 opacity-50"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"/></svg>
									<input
										type="text"
										bind:value={sourceSearchQuery}
										placeholder="Search..."
										class="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
									/>
									{#if sourceSearchQuery}
										<button
											type="button"
											onclick={() => (sourceSearchQuery = '')}
											class="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-accent mr-1 cursor-pointer"
											title="Clear search"
											aria-label="Clear search"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
										</button>
									{/if}
								</div>

								<!-- Options -->
								<div class="overflow-y-auto max-h-52 px-1 py-1">
									{#if filteredSourceOptions.length === 0}
										<div class="px-2 py-1.5 text-xs text-muted-foreground text-center">
											No results found.
										</div>
									{:else}
										{#each filteredSourceOptions as opt (opt.id)}
											{@const isSelected = formAttendanceSourceCuid === opt.id}
											<button
												type="button"
												onclick={() => {
													formAttendanceSourceCuid = opt.id;
													isSourceDropdownOpen = false;
												}}
												class="flex items-center justify-between w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none rounded-md {isSelected ? 'bg-accent/50 text-accent-foreground font-medium' : ''}"
											>
												<span class="truncate">{opt.label}</span>
												{#if isSelected}
													<CheckIcon class="size-4 shrink-0 text-hrms-primary dark:text-hrms-primary ml-2" />
												{/if}
											</button>
										{/each}
									{/if}
								</div>

								<!-- Add New Action -->
								<div class="border-t border-border p-1 bg-muted/20 mt-1">
									<button
										type="button"
										class="flex items-center justify-center gap-1.5 w-full rounded-sm px-2 py-1.5 text-xs font-medium border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none"
										onclick={(e) => {
											e.stopPropagation();
											isAddSourceModalOpen = true;
										}}
									>
										Add Attendance Source
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Remarks -->
			<div class="space-y-2">
				<Label for="modal_remarks">Remarks</Label>
				<textarea
					id="modal_remarks"
					name="remarks"
					bind:value={formRemarks}
					rows="3"
					placeholder="Add administrative remarks..."
					class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 outline-none min-h-20"
				></textarea>
			</div>

			<!-- Form Actions -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
				<Button
					type="button"
					variant="outline"
					onclick={cancel}
					disabled={isSubmitting}
				>
					{UI_CONSTANTS.BUTTON_CANCEL}
				</Button>
				<Button
					type="submit"
					class="bg-hrms-primary text-white hover:bg-hrms-primary/90 border-none font-semibold"
					disabled={isSubmitDisabled}
				>
					{#if isSubmitting}
						{UI_CONSTANTS.BUTTON_SAVING}
					{:else}
						{editCuid ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE}
					{/if}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<!-- Add Attendance Source Modal -->
<CrudModal
	open={isAddSourceModalOpen}
	title="Add Attendance Source"
	description="Create a new attendance source master record."
	onClose={() => {
		isAddSourceModalOpen = false;
		newSourceName = '';
		newSourceError = '';
	}}
	preventOutsideClickClose={true}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleAddAttendanceSource}>
			<div class="space-y-2">
				<Label for="new_source_name" class={newSourceError ? 'text-destructive' : ''}>Attendance Source Name <span class="text-destructive">*</span></Label>
				<Input
					id="new_source_name"
					bind:value={newSourceName}
					class={newSourceError ? 'border-destructive focus-visible:ring-destructive/30' : ''}
					placeholder="e.g. Biometric, Mobile App"
					oninput={() => { newSourceError = ''; }}
				/>
				{#if newSourceError}
					<p class="text-xs font-medium text-destructive mt-1">{newSourceError}</p>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 pt-6">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSavingNewSource}>Cancel</Button>
				<Button type="submit" class="bg-hrms-primary text-white hover:bg-hrms-primary/90" disabled={isSavingNewSource || !newSourceName.trim()}>
					{#if isSavingNewSource}
						<LoaderCircleIcon class="size-4 animate-spin" />
						Saving...
					{:else}
						Save
					{/if}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<style>
	:global([data-radix-popper-content-wrapper]) {
		z-index: 300 !important;
	}
</style>
