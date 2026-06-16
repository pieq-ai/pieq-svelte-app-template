<script lang="ts">
	import { slide } from 'svelte/transition';
	import { invalidateAll, beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		Badge,
		Button,
		Card,
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
		TableActions
	} from '$lib/components';
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

	// Sorting
	let sortKey = $state<string | null>('attendance_date');
	let sortDirection = $state<'asc' | 'desc' | null>('desc');

	// Modal States
	let isFormModalOpen = $state(false);
	let isConfirmOpen = $state(false);
	let isSubmitting = $state(false);

	// Record to Edit/Delete
	let editCuid = $state<string | null>(null);
	let activeDeleteCuid = $state<string | null>(null);

	// Form local state
	let formEmployeeCuid = $state('');
	let formAttendanceDate = $state('');
	let formCheckInTime = $state('');
	let formCheckOutTime = $state('');
	let formAttendanceStatus = $state('');
	let formAttendanceSourceCuid = $state('');
	let formRemarks = $state('');

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	// New Form states for smart save & custom datepicker
	let formCheckInTimeOnly = $state('');
	let formCheckOutTimeOnly = $state('');
	let empSearchQuery = $state('');
	let isDiscardModalOpen = $state(false);
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
			label: emp.name
		}))
	);

	let filteredEmployeeFormOptions = $derived.by(() => {
		const q = empSearchQuery.toLowerCase().trim();
		if (!q) return employeeFormOptions;
		return employeeFormOptions.filter(o => o.label.toLowerCase().includes(q));
	});

	let statusFilterOptions = [
		{ value: 'all', label: 'All Status' },
		...statusOptions.filter((opt) => opt.value !== 'Week Off')
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
			formAttendanceDate !== editingRecord.attendance_date ||
			formCheckInTimeOnly !== originalCheckInTime ||
			formCheckOutTimeOnly !== originalCheckOutTime ||
			formAttendanceStatus !== editingRecord.attendance_status ||
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

		const checkInDateTimeStr = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : '';
		const checkOutDateTimeStr = formAttendanceDate && formCheckOutTimeOnly ? `${formAttendanceDate}T${formCheckOutTimeOnly}` : '';

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



	async function confirmDiscard() {
		isDiscardModalOpen = false;
		isNavigatingProgrammatically = true;
		
		formEmployeeCuid = '';
		formAttendanceDate = '';
		formCheckInTimeOnly = '';
		formCheckOutTimeOnly = '';
		formAttendanceStatus = '';
		formAttendanceSourceCuid = '';
		formRemarks = '';
		isFormModalOpen = false;
		
		if (pendingNavigation) {
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				await goto(resolve((target.pathname + target.search) as '/attendance-records'));
			}
		} else if (editCuid) {
			await goto(resolve('/attendance-records'), { replaceState: true });
		}
		
		isNavigatingProgrammatically = false;
	}

	beforeNavigate((navigation) => {
		if (!isFormModalOpen || !hasUnsavedChanges) {
			return;
		}

		if (isNavigatingProgrammatically) {
			return;
		}

		navigation.cancel();
		pendingNavigation = navigation;
		isDiscardModalOpen = true;
	});

	$effect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isFormModalOpen && hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
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
			submissionAttempted = false;
			isDiscardModalOpen = false;
			editCuid = null;

			isSourceDropdownOpen = false;
			sourceSearchQuery = '';
			newSourceName = '';
			newSourceError = '';
			isAddSourceModalOpen = false;
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
			case 'Absent':
				return 'bg-red-500/15 text-red-800 dark:bg-red-500/25 dark:text-red-300 border border-red-500/30 dark:border-red-500/40';
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
	function getFormErrors() {
		const errs: Record<string, string> = {};
		if (!formEmployeeCuid) errs.employee_cuid = 'Employee is required';
		if (!formAttendanceDate) errs.attendance_date = 'Attendance date is required';
		if (!formAttendanceStatus) errs.attendance_status = 'Status is required';

		const checkInDateTimeStr = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : '';
		const checkOutDateTimeStr = formAttendanceDate && formCheckOutTimeOnly ? `${formAttendanceDate}T${formCheckOutTimeOnly}` : '';

		if (checkInDateTimeStr && checkOutDateTimeStr) {
			const checkIn = new Date(checkInDateTimeStr);
			const checkOut = new Date(checkOutDateTimeStr);
			if (checkOut < checkIn) {
				errs.check_out_time = 'Check out time cannot be before check in time';
			}
		}
		return errs;
	}

	// CRUD Ops
	function openAddModal() {
		editCuid = null;
		formEmployeeCuid = '';
		formAttendanceDate = '';
		formCheckInTimeOnly = '';
		formCheckOutTimeOnly = '';
		formAttendanceStatus = '';
		formAttendanceSourceCuid = '';
		formRemarks = '';
		errors = {};
		submissionAttempted = false;
		isFormModalOpen = true;

		isSourceDropdownOpen = false;
		sourceSearchQuery = '';
		newSourceName = '';
		newSourceError = '';
	}

	function openEditModal(record: any) {
		editCuid = record.cuid;
		formEmployeeCuid = record.employee_cuid;
		formAttendanceDate = record.attendance_date;
		
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

		formAttendanceStatus = record.attendance_status;
		formAttendanceSourceCuid = record.attendance_source_cuid || '';
		formRemarks = record.remarks || '';
		errors = {};
		submissionAttempted = false;
		isFormModalOpen = true;

		isSourceDropdownOpen = false;
		sourceSearchQuery = '';
		newSourceName = '';
		newSourceError = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		const formErrors = getFormErrors();
		if (Object.keys(formErrors).length > 0) {
			errors = formErrors;
			return;
		}

		isSubmitting = true;

		const checkInISO = formAttendanceDate && formCheckInTimeOnly ? `${formAttendanceDate}T${formCheckInTimeOnly}` : null;
		const checkOutISO = formAttendanceDate && formCheckOutTimeOnly ? `${formAttendanceDate}T${formCheckOutTimeOnly}` : null;

		const payload = {
			employee_cuid: formEmployeeCuid,
			attendance_date: formAttendanceDate,
			check_in_time: checkInISO ? new Date(checkInISO).toISOString() : null,
			check_out_time: checkOutISO ? new Date(checkOutISO).toISOString() : null,
			attendance_status: formAttendanceStatus,
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
				isFormModalOpen = false;
				await invalidateAll();
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

	async function handleDelete() {
		if (!activeDeleteCuid) return;
		isSubmitting = true;

		try {
			const res = await fetch(`/api/attendance-records/${activeDeleteCuid}`, {
				method: 'DELETE'
			});

			const body = await res.json();
			if (res.ok) {
				toast.success(body.data?.message || 'Record deleted successfully');
				isConfirmOpen = false;
				activeDeleteCuid = null;
				await invalidateAll();
			} else {
				toast.error(body.data?.error || 'Failed to delete record');
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

	let summaryCounts = $derived.by(() => {
		const recordsForDate = data.records.filter((rec) => rec.attendance_date === summaryDate);
		const present = recordsForDate.filter((rec) => rec.attendance_status === 'Present').length;
		const leave = recordsForDate.filter((rec) => rec.attendance_status === 'Leave' || rec.attendance_status === 'On Leave').length;
		const wfh = recordsForDate.filter((rec) => rec.attendance_status === 'WFH').length;
		const halfDay = recordsForDate.filter((rec) => rec.attendance_status === 'Half Day').length;
		const lop = recordsForDate.filter((rec) => rec.attendance_status === 'LOP' || rec.attendance_status === 'Absent').length;
		
		const loggedInCuids = new Set(recordsForDate.map((rec) => rec.employee_cuid));
		const notLoggedIn = data.employees.filter((emp) => !loggedInCuids.has(emp.uuid)).length;

		return {
			total: data.employees.length,
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
		const recordsForDate = data.records.filter((rec) => rec.attendance_date === summaryDate);
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
				// Virtual "Not Logged In" record
				list.push({
					cuid: `virtual-${emp.uuid}-${summaryDate}`,
					employee_cuid: emp.uuid,
					attendance_date: summaryDate,
					check_in_time: null,
					check_out_time: null,
					work_duration_minutes: null,
					attendance_status: 'Not Logged In',
					attendance_source_cuid: null,
					remarks: null,
					created_at: new Date(summaryDate).toISOString(),
					updated_at: new Date(summaryDate).toISOString(),
					isVirtual: true
				});
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
					(rec) => rec.attendance_status === 'LOP' || rec.attendance_status === 'Absent'
				);
			} else if (filterStatus === 'Leave') {
				result = result.filter(
					(rec) => rec.attendance_status === 'Leave' || rec.attendance_status === 'On Leave'
				);
			} else {
				result = result.filter((rec) => rec.attendance_status === filterStatus);
			}
		}

		if (filterSourceCuid !== 'all') {
			result = result.filter((rec) => rec.attendance_source_cuid === filterSourceCuid);
		}

		// Sorting
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				let valA = a[sortKey as keyof typeof a];
				let valB = b[sortKey as keyof typeof b];

				if (sortKey === 'employee_name') {
					valA = getEmployeeName(a.employee_cuid);
					valB = getEmployeeName(b.employee_cuid);
				}

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
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0 font-semibold"
			onclick={openAddModal}
		>
			Add Record
		</Button>
	</div>

	<!-- Summary Cards Section -->
	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
		<!-- Total Employees Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
			<span class="text-2xl font-bold text-foreground mt-1">{summaryCounts.total}</span>
		</div>
		
		<!-- Present Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
			<span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summaryCounts.present}</span>
		</div>

		<!-- Leave Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave</span>
			<span class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summaryCounts.leave}</span>
		</div>

		<!-- WFH Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WFH</span>
			<span class="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{summaryCounts.wfh}</span>
		</div>

		<!-- Half Day Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Half Day</span>
			<span class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{summaryCounts.halfDay}</span>
		</div>

		<!-- LOP Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LOP</span>
			<span class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{summaryCounts.lop}</span>
		</div>

		<!-- Not Logged In Card -->
		<div class="flex flex-col p-4 rounded-xl border border-border bg-card text-left shadow-xs">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Not Logged In</span>
			<span class="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-1">{summaryCounts.notLoggedIn}</span>
		</div>
	</div>

	<!-- Filters & Search -->
	<div class="space-y-3">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center">
			<div class="relative flex-1 min-w-0">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by employee name..."
					bind:value={searchQuery}
					class="pl-9 pr-9"
				/>
				{#if searchQuery}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="absolute top-1/2 right-1 -translate-y-1/2"
						aria-label="Clear search"
						onclick={() => (searchQuery = '')}
					>
						<XIcon class="size-4" />
					</Button>
				{/if}
			</div>

			<div class="grid grid-cols-2 md:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
				<!-- Date Filter -->
				<div class="w-full">
					<DatePicker
						placeholder="Filter Date"
						bind:value={summaryDate}
					/>
				</div>

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
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)]">
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
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
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
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('employee_name')}>
								Employee
								{#if sortKey === 'employee_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'employee_name' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('attendance_date')}>
								Date
								{#if sortKey === 'attendance_date' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-1 size-3.5" />
								{:else if sortKey === 'attendance_date' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-1 size-3.5" />
								{:else}
									<ArrowUpDownIcon class="ml-1 size-3.5" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold">Check In</TableHead>
						<TableHead class="font-bold">Check Out</TableHead>
						<TableHead class="font-bold">Work Duration</TableHead>
						<TableHead class="font-bold">Status</TableHead>
						<TableHead class="font-bold">Source</TableHead>
						<TableHead class="font-bold">Updated At</TableHead>
						<TableHead class="text-right font-bold">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredRecords.length === 0}
						<TableRow>
							<TableCell colspan={9} class="py-12 text-center text-muted-foreground font-medium">
								No attendance records found
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedRecords as rec (rec.cuid)}
							<TableRow 
								class={rec.isVirtual ? "" : "hover:bg-muted/50 cursor-pointer"} 
								onclick={(e) => {
									if (rec.isVirtual) return;
									const target = e.target as HTMLElement;
									if (target.closest('button') || target.closest('a')) return;
									openEditModal(rec);
								}}
							>
								<TableCell class="font-semibold">{getEmployeeName(rec.employee_cuid)}</TableCell>
								<TableCell>{formatDate(rec.attendance_date)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_in_time)}</TableCell>
								<TableCell>{formatDisplayTime(rec.check_out_time)}</TableCell>
								<TableCell>{formatDuration(rec.work_duration_minutes)}</TableCell>
								<TableCell>
									<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(rec.attendance_status)}`}>
										{rec.attendance_status}
									</Badge>
								</TableCell>
								<TableCell>{getSourceName(rec.attendance_source_cuid)}</TableCell>
								<TableCell>{rec.isVirtual ? '--' : formatDate(rec.updated_at)}</TableCell>
								<TableCell class="text-right">
									{#if !rec.isVirtual}
										<TableActions
											onEdit={() => openEditModal(rec)}
											showIcons={false}
										/>
									{:else}
										<span class="text-muted-foreground text-xs select-none">--</span>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination totalItems={filteredRecords.length} bind:currentPage={currentPage} pageSize={pageSize} showIcons={false} />
	</div>
</div>

<!-- Add/Edit Modal -->
<CrudModal
	open={isFormModalOpen}
	title={editCuid ? 'Edit Attendance Record' : 'Create Attendance Record'}
	isDirty={hasUnsavedChanges}
	onClose={confirmDiscard}
	preventOutsideClickClose={true}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			<!-- Employee Selector -->
			<div class="space-y-2 flex flex-col">
				<Label class={errors.employee_cuid ? 'text-destructive font-semibold' : ''}>Employee <span class="text-destructive font-bold">*</span></Label>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none {errors.employee_cuid ? 'border-destructive' : ''}" {...props}>
								<span class="truncate pr-2">
									{formEmployeeCuid ? (employeeFormOptions.find(o => o.id === formEmployeeCuid)?.label || 'Select Employee') : 'Select Employee'}
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
				{#if errors.employee_cuid}
					<p class="text-xs font-semibold text-destructive mt-0.5">{errors.employee_cuid}</p>
				{/if}
			</div>

			<!-- Date Selector -->
			<div class="space-y-2">
				<Label for="modal_date" class={errors.attendance_date ? 'text-destructive font-semibold' : ''}>Attendance Date <span class="text-destructive font-bold">*</span></Label>
				<DatePicker
					id="modal_date"
					name="attendance_date"
					bind:value={formAttendanceDate}
					onchange={() => {
						errors.attendance_date = '';
					}}
					required={true}
					hasError={!!errors.attendance_date}
				/>
				{#if errors.attendance_date}
					<p class="text-xs font-semibold text-destructive mt-0.5">{errors.attendance_date}</p>
				{/if}
			</div>

			<!-- Check-In and Check-Out Time Row -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="modal_check_in_time" class={errors.check_in_time ? 'text-destructive font-semibold' : ''}>Check In Time</Label>
					<Input
						id="modal_check_in_time"
						name="check_in_time"
						type="time"
						bind:value={formCheckInTimeOnly}
						oninput={() => {
							errors.check_in_time = '';
							errors.check_out_time = '';
						}}
						class={errors.check_in_time ? 'border-destructive' : ''}
					/>
					{#if errors.check_in_time}
						<p class="text-xs font-semibold text-destructive mt-0.5">{errors.check_in_time}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="modal_check_out_time" class={errors.check_out_time ? 'text-destructive font-semibold' : ''}>Check Out Time</Label>
					<Input
						id="modal_check_out_time"
						name="check_out_time"
						type="time"
						bind:value={formCheckOutTimeOnly}
						oninput={() => {
							errors.check_in_time = '';
							errors.check_out_time = '';
						}}
						class={errors.check_out_time ? 'border-destructive' : ''}
					/>
					{#if errors.check_out_time}
						<p class="text-xs font-semibold text-destructive mt-0.5">{errors.check_out_time}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Status Selector -->
				<div class="space-y-2 flex flex-col">
					<Label for="modal_status" class={errors.attendance_status ? 'text-destructive font-semibold' : ''}>Status <span class="text-destructive font-bold">*</span></Label>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none {errors.attendance_status ? 'border-destructive' : ''}" {...props}>
									<span class="truncate pr-2">
										{formAttendanceStatus ? (statusOptions.find(o => o.value === formAttendanceStatus)?.label || 'Select Status') : 'Select Status'}
									</span>
									<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
							<DropdownMenu.Group>
								{#each modalStatusOptions as opt}
									<DropdownMenu.Item
										onclick={() => {
											formAttendanceStatus = opt.value;
											errors.attendance_status = '';
										}}
										class="justify-between cursor-pointer {formAttendanceStatus === opt.value ? 'bg-accent text-accent-foreground font-semibold' : ''}"
									>
										<span class="truncate pr-2">{opt.label}</span>
										{#if formAttendanceStatus === opt.value}
											<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					{#if errors.attendance_status}
						<p class="text-xs font-semibold text-destructive mt-0.5">{errors.attendance_status}</p>
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
							class="flex items-center justify-between w-full h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow] hover:bg-accent/30 focus:border-ring focus:ring-ring/50 focus:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none cursor-pointer select-none text-left {isSourceDropdownOpen ? 'border-ring ring-ring/50 ring-3' : ''}"
						>
							<div class="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 pr-2">
								{#if !formAttendanceSourceCuid}
									<span class="text-muted-foreground truncate select-none">Select Source</span>
								{:else}
									<div class="flex items-center gap-1.5 overflow-hidden min-w-0">
										<span class="inline-flex items-center bg-[#262626] text-white dark:bg-neutral-200 dark:text-[#262626] text-xs font-medium px-2 py-0.5 rounded-sm border border-border/20 truncate max-w-[140px] select-none h-6">
											{modalSourceOptions.find(o => o.id === formAttendanceSourceCuid)?.label || 'Select Source'}
										</span>
									</div>
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
													<CheckIcon class="size-4 shrink-0 text-[#F45310] dark:text-[#F45310] ml-2" />
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
					class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-none font-semibold"
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

<!-- Delete Confirmation Modal -->
<ConfirmModal
	open={isConfirmOpen}
	title="Delete Attendance Record"
	description="Are you sure you want to delete this attendance record? This action cannot be undone."
	confirmLabel="Delete"
	isSubmitting={isSubmitting}
	onCancel={() => {
		isConfirmOpen = false;
		activeDeleteCuid = null;
	}}
	onConfirm={handleDelete}
/>

<!-- Discard Changes Confirmation Modal -->
<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Keep Editing"
	onCancel={confirmDiscard}
	onConfirm={() => (isDiscardModalOpen = false)}
	preventOutsideClickClose={true}
/>


<!-- Add Attendance Source Modal -->
<CrudModal
	open={isAddSourceModalOpen}
	title="Add Attendance Source"
	description="Create a new attendance source master record."
	isDirty={newSourceName.trim() !== ''}
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
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSavingNewSource || !newSourceName.trim()}>
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
