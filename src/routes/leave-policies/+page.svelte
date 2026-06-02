<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll, beforeNavigate } from '$app/navigation';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import {
		Alert,
		AlertDescription,
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
		toast,
		ConfirmModal,
		FormModal,
		Pagination
	} from '$lib/components/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let currentPage = $state(1);
	let searchQuery = $state('');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);
	let filterLeaveType = $state<string>('all');
	let filterEmploymentType = $state<string>('all');
	let filterStatus = $state<string>('all');

	function handleSort(key: string) {
		currentPage = 1; // Reset to page 1 on sort change
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

	let activeMenuCuid = $state<string | null>(null);
	let menuPosition = $state({ top: 0, left: 0 });

	function toggleMenu(cuid: string, event: MouseEvent) {
		event.stopPropagation();
		if (activeMenuCuid === cuid) {
			activeMenuCuid = null;
		} else {
			const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
			menuPosition = {
				top: rect.bottom,
				left: rect.right - 112 // width of w-28 is 112px
			};
			activeMenuCuid = cuid;
		}
	}

	// Close kebab menu on click outside or scroll
	$effect(() => {
		const handleDismiss = () => {
			activeMenuCuid = null;
		};
		document.addEventListener('click', handleDismiss);
		window.addEventListener('scroll', handleDismiss, { passive: true });
		return () => {
			document.removeEventListener('click', handleDismiss);
			window.removeEventListener('scroll', handleDismiss);
		};
	});

	function openAddModal() {
		leaveTypeId = '';
		selectedEmploymentTypes = [];
		annualQuota = '';
		maxPerMonth = '';
		carryForwardAllowed = false;
		maxCarryForwardDays = '';
		requiresDocument = false;
		minServiceDays = '0';
		allowHalfDay = false;
		genderSpecific = false;
		applicableGender = '';
		status = true;
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		// Validate all fields client-side simultaneously
		const leaveTypeErr = getLeaveTypeIdError(leaveTypeId);
		const empTypesErr = getEmploymentTypesError(selectedEmploymentTypes);
		const quotaErr = getQuotaError(annualQuota);
		const maxPerMonthErr = getMaxPerMonthError(maxPerMonth, annualQuota);
		const carryForwardErr = getCarryForwardDaysError(carryForwardAllowed, maxCarryForwardDays);
		const minServiceErr = getMinServiceDaysError(minServiceDays);
		const genderErr = getGenderError(genderSpecific, applicableGender);

		errors.leave_type_cuid = leaveTypeErr;
		errors.employment_type_cuids = empTypesErr;
		errors.annual_quota = quotaErr;
		errors.max_per_month = maxPerMonthErr;
		errors.max_carry_forward_days = carryForwardErr;
		errors.min_service_days = minServiceErr;
		errors.applicable_gender = genderErr;

		if (
			leaveTypeErr ||
			empTypesErr ||
			quotaErr ||
			maxPerMonthErr ||
			carryForwardErr ||
			minServiceErr ||
			genderErr
		) {
			toast.error('Please fix the validation errors.');
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			leave_type_cuid: leaveTypeId,
			employment_type_cuids: selectedEmploymentTypes,
			annual_quota: annualQuota,
			max_per_month: maxPerMonth || null,
			carry_forward_allowed: carryForwardAllowed,
			max_carry_forward_days: carryForwardAllowed ? maxCarryForwardDays : null,
			requires_document: requiresDocument,
			min_service_days: minServiceDays,
			allow_half_day: allowHalfDay,
			gender_specific: genderSpecific,
			applicable_gender: genderSpecific ? applicableGender : null,
			status: status
		};

		try {
			const url = editUuid ? `/api/leave/policies/leavePolicyCuid=${editUuid}` : '/api/leave/policies';
			const res = await fetch(url, {
				method: editUuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json();

			if (res.ok && result.data) {
				toast.success(result.data.message);
				isFormModalOpen = false;
				if (editUuid) {
					await goto(resolve('/leave-policies'), { replaceState: true });
				} else {
					leaveTypeId = '';
					selectedEmploymentTypes = [];
					annualQuota = '';
					maxPerMonth = '';
					carryForwardAllowed = false;
					maxCarryForwardDays = '';
					requiresDocument = false;
					minServiceDays = '0';
					allowHalfDay = false;
					genderSpecific = false;
					applicableGender = '';
					status = true;
				}
				await invalidateAll();
			} else {
				const errorMsg = result.data?.error || 'Validation failed';
				form = {
					error: errorMsg,
					field: result.data?.field,
					action: editUuid ? 'update' : 'create'
				};
				if (result.data?.field) {
					errors[result.data.field] = errorMsg;
				} else {
					errors.general = errorMsg;
				}
			}
		} catch (error) {
			console.error('Submit failed:', error);
			toast.error('An unexpected error occurred.');
		} finally {
			isSubmitting = false;
		}
	}



	// Active Edit Mode Detection from URL query parameter
	let editUuid = $derived(page.url.searchParams.get('edit'));
	let editingPolicy = $derived(data.policies.find((p) => p.cuid === editUuid));

	// Form local state
	let leaveTypeId = $state('');
	let selectedEmploymentTypes = $state<string[]>([]);
	let annualQuota = $state('');
	let maxPerMonth = $state('');
	let carryForwardAllowed = $state(false);
	let maxCarryForwardDays = $state('');
	let requiresDocument = $state(false);
	let minServiceDays = $state('');
	let allowHalfDay = $state(false);
	let genderSpecific = $state(false);
	let applicableGender = $state<'Male' | 'Female' | 'Others' | ''>('');
	let status = $state(true);

	let hasChanges = $derived.by(() => {
		if (!editUuid || !editingPolicy) return false;

		const originalMaxPerMonth = editingPolicy.max_per_month !== null ? String(editingPolicy.max_per_month) : '';
		const originalMaxCarryForwardDays = editingPolicy.max_carry_forward_days !== null ? String(editingPolicy.max_carry_forward_days) : '';
		const originalMinServiceDays = String(editingPolicy.min_service_days);
		const originalApplicableGender = editingPolicy.applicable_gender || '';

		const empTypesEqual = (() => {
			const a = selectedEmploymentTypes;
			const b = editingPolicy.employment_type_cuids;
			if (a.length !== b.length) return false;
			const sortedA = [...a].sort();
			const sortedB = [...b].sort();
			return sortedA.every((val, index) => val === sortedB[index]);
		})();

		return (
			leaveTypeId !== String(editingPolicy.leave_type_cuid) ||
			!empTypesEqual ||
			annualQuota !== String(editingPolicy.annual_quota) ||
			maxPerMonth !== originalMaxPerMonth ||
			carryForwardAllowed !== editingPolicy.carry_forward_allowed ||
			maxCarryForwardDays !== originalMaxCarryForwardDays ||
			requiresDocument !== editingPolicy.requires_document ||
			minServiceDays !== originalMinServiceDays ||
			allowHalfDay !== editingPolicy.allow_half_day ||
			genderSpecific !== editingPolicy.gender_specific ||
			applicableGender !== originalApplicableGender ||
			status !== editingPolicy.status
		);
	});

	let hasUnsavedChanges = $derived.by(() => {
		if (editUuid) {
			return hasChanges;
		} else {
			return (
				leaveTypeId !== '' ||
				selectedEmploymentTypes.length > 0 ||
				annualQuota !== '' ||
				maxPerMonth !== '' ||
				carryForwardAllowed !== false ||
				maxCarryForwardDays !== '' ||
				requiresDocument !== false ||
				minServiceDays !== '0' ||
				allowHalfDay !== false ||
				genderSpecific !== false ||
				applicableGender !== '' ||
				status !== true
			);
		}
	});

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		
		const leaveTypeErr = getLeaveTypeIdError(leaveTypeId);
		const empTypesErr = getEmploymentTypesError(selectedEmploymentTypes);
		const quotaErr = getQuotaError(annualQuota);
		const maxPerMonthErr = getMaxPerMonthError(maxPerMonth, annualQuota);
		const carryForwardErr = getCarryForwardDaysError(carryForwardAllowed, maxCarryForwardDays);
		const minServiceErr = getMinServiceDaysError(minServiceDays);
		const genderErr = getGenderError(genderSpecific, applicableGender);

		const hasValidationErrors =
			!!leaveTypeErr ||
			!!empTypesErr ||
			!!quotaErr ||
			!!maxPerMonthErr ||
			!!carryForwardErr ||
			!!minServiceErr ||
			!!genderErr;

		if (editUuid) {
			if (!leaveTypeId || selectedEmploymentTypes.length === 0 || !annualQuota || !minServiceDays) return true;
			if (genderSpecific && !applicableGender) return true;
			if (carryForwardAllowed && !maxCarryForwardDays) return true;
			if (hasValidationErrors) return true;
			return !hasChanges;
		} else {
			if (!leaveTypeId || selectedEmploymentTypes.length === 0 || !annualQuota || !minServiceDays) return true;
			if (genderSpecific && !applicableGender) return true;
			if (carryForwardAllowed && !maxCarryForwardDays) return true;
			return hasValidationErrors;
		}
	});

	let isDiscardModalOpen = $state(false);
	let pendingNavigation = $state<import('@sveltejs/kit').Navigation | null>(null);
	let isNavigatingProgrammatically = $state(false);

	function handleCloseRequest() {
		if (hasUnsavedChanges) {
			isDiscardModalOpen = true;
		} else {
			isFormModalOpen = false;
		}
	}

	async function confirmDiscard() {
		isDiscardModalOpen = false;
		isNavigatingProgrammatically = true;
		
		leaveTypeId = '';
		selectedEmploymentTypes = [];
		annualQuota = '';
		maxPerMonth = '';
		carryForwardAllowed = false;
		maxCarryForwardDays = '';
		requiresDocument = false;
		minServiceDays = '0';
		allowHalfDay = false;
		genderSpecific = false;
		applicableGender = '';
		status = true;
		isFormModalOpen = false;
		
		if (pendingNavigation) {
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				await goto(resolve((target.pathname + target.search) as '/leave-policies'));
			}
		} else if (editUuid) {
			await goto(resolve('/leave-policies'), { replaceState: true });
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

	let hasSynchronized = $state(false);

	$effect(() => {
		if (isFormModalOpen) {
			hasSynchronized = false;
			submissionAttempted = false;
			errors = {};
		}
	});

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (!isFormModalOpen) return;
		if (hasSynchronized) return;

		if (editingPolicy) {
			leaveTypeId = String(editingPolicy.leave_type_cuid);
			selectedEmploymentTypes = editingPolicy.employment_type_cuids;
			annualQuota = String(editingPolicy.annual_quota);
			maxPerMonth = editingPolicy.max_per_month !== null ? String(editingPolicy.max_per_month) : '';
			carryForwardAllowed = editingPolicy.carry_forward_allowed;
			maxCarryForwardDays = editingPolicy.max_carry_forward_days !== null ? String(editingPolicy.max_carry_forward_days) : '';
			requiresDocument = editingPolicy.requires_document;
			minServiceDays = String(editingPolicy.min_service_days);
			allowHalfDay = editingPolicy.allow_half_day;
			genderSpecific = editingPolicy.gender_specific;
			applicableGender = editingPolicy.applicable_gender || '';
			status = editingPolicy.status;
			hasSynchronized = true;
		} else if (!editUuid) {
			leaveTypeId = '';
			selectedEmploymentTypes = [];
			annualQuota = '';
			maxPerMonth = '';
			carryForwardAllowed = false;
			maxCarryForwardDays = '';
			requiresDocument = false;
			minServiceDays = '0';
			allowHalfDay = false;
			genderSpecific = false;
			applicableGender = '';
			status = true;
			hasSynchronized = true;
		}
	});

	// Sync isFormModalOpen with editUuid
	$effect(() => {
		if (editUuid) {
			isFormModalOpen = true;
		}
	});

	// Reset form state and clear query parameter on modal close
	$effect(() => {
		if (!isFormModalOpen) {
			form = null;
			isSubmitting = false;
			leaveTypeId = '';
			selectedEmploymentTypes = [];
			annualQuota = '';
			maxPerMonth = '';
			carryForwardAllowed = false;
			maxCarryForwardDays = '';
			requiresDocument = false;
			minServiceDays = '0';
			allowHalfDay = false;
			genderSpecific = false;
			applicableGender = '';
			status = true;
			errors = {};
			submissionAttempted = false;
			hasSynchronized = false;
			isDiscardModalOpen = false;
			if (editUuid) {
				goto(resolve('/leave-policies'), { replaceState: true });
			}
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	function getLeaveTypeIdError(id: string): string {
		if (!id) return 'Leave type is required.';
		return '';
	}

	function getEmploymentTypesError(types: string[]): string {
		if (types.length === 0) {
			return 'At least one employment type must be selected';
		}
		return '';
	}

	function getQuotaError(quotaStr: string): string {
		if (!quotaStr || quotaStr.trim() === '') return 'Annual quota is required.';
		const quota = Number(quotaStr);
		if (isNaN(quota) || quota < 0) {
			return 'Annual quota must be a positive number';
		}
		return '';
	}

	function getMaxPerMonthError(maxMStr: string, quotaStr: string): string {
		if (!maxMStr || maxMStr.trim() === '') return '';
		const maxM = Number(maxMStr);
		if (isNaN(maxM) || maxM < 0) {
			return 'Max per month must be a positive number';
		}
		if (quotaStr) {
			const quota = Number(quotaStr);
			if (!isNaN(quota) && maxM > quota) {
				return 'Max per month cannot exceed annual quota';
			}
		}
		return '';
	}

	function getCarryForwardDaysError(allowed: boolean, daysStr: string): string {
		if (!allowed) return '';
		if (!daysStr || String(daysStr).trim() === '') {
			return 'Max carry forward days is required when carry forward is allowed';
		}
		const days = Number(daysStr);
		if (isNaN(days) || days <= 0) {
			return 'Max carry forward days must be greater than 0';
		}
		return '';
	}

	function getMinServiceDaysError(daysStr: string): string {
		if (!daysStr || daysStr.trim() === '') return 'Min service days is required.';
		const days = Number(daysStr);
		if (isNaN(days) || !Number.isInteger(days) || days < 0) {
			return 'Min service days must be a positive integer';
		}
		return '';
	}

	function getGenderError(specific: boolean, gender: string): string {
		if (specific && !gender) {
			return 'Applicable gender is required when gender specific is enabled';
		}
		return '';
	}

	let quotaError = $derived(errors.annual_quota || '');
	let maxPerMonthError = $derived(errors.max_per_month || '');
	let carryForwardDaysError = $derived(errors.max_carry_forward_days || '');
	let minServiceDaysError = $derived(errors.min_service_days || '');
	let genderError = $derived(errors.applicable_gender || '');
	let employmentTypesError = $derived(errors.employment_type_cuids || '');
	let leaveTypeIdError = $derived(errors.leave_type_cuid || '');

	function toggleEmploymentType(uuid: string) {
		if (selectedEmploymentTypes.includes(uuid)) {
			selectedEmploymentTypes = selectedEmploymentTypes.filter((x) => x !== uuid);
		} else {
			selectedEmploymentTypes = [...selectedEmploymentTypes, uuid];
		}
	}

	function getLeaveTypeName(uuid: string): string {
		const found = data.leaveTypes.find((t) => t.cuid === uuid);
		return found ? found.leave_name : `UUID: ${uuid}`;
	}

	function getEmploymentTypeNames(uuids: string[]): string {
		if (uuids.length === 0) return 'None';
		return uuids
			.map((uuid) => {
				const found = data.employmentTypes.find((et) => et.cuid === uuid);
				return found ? found.employment_name : `UUID: ${uuid}`;
			})
			.join(', ');
	}

	// Derived list
	let filteredPolicies = $derived.by(() => {
		let result = [...data.policies];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((p) => {
				const leaveName = getLeaveTypeName(p.leave_type_cuid).toLowerCase();
				const empNames = getEmploymentTypeNames(p.employment_type_cuids).toLowerCase();
				return leaveName.includes(query) || empNames.includes(query);
			});
		}

		if (filterLeaveType !== 'all') {
			result = result.filter((p) => p.leave_type_cuid === filterLeaveType);
		}

		if (filterEmploymentType !== 'all') {
			result = result.filter((p) => p.employment_type_cuids.includes(filterEmploymentType));
		}

		if (filterStatus !== 'all') {
			const targetStatus = filterStatus === 'active';
			result = result.filter((p) => p.status === targetStatus);
		}

		// Sort behavior
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				let valA: string | number | boolean | string[] | null | undefined;
				let valB: string | number | boolean | string[] | null | undefined;

				if (sortKey === 'leave_type_cuid') {
					valA = getLeaveTypeName(a.leave_type_cuid);
					valB = getLeaveTypeName(b.leave_type_cuid);
				} else if (sortKey === 'employment_type_cuids') {
					valA = getEmploymentTypeNames(a.employment_type_cuids);
					valB = getEmploymentTypeNames(b.employment_type_cuids);
				} else {
					valA = a[sortKey as keyof typeof a];
					valB = b[sortKey as keyof typeof b];
				}

				if (typeof valA === 'number' && typeof valB === 'number') {
					return sortDirection === 'asc' ? valA - valB : valB - valA;
				}

				if (typeof valA === 'boolean' && typeof valB === 'boolean') {
					const numA = valA ? 1 : 0;
					const numB = valB ? 1 : 0;
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}

				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc'
						? valA.localeCompare(valB)
						: valB.localeCompare(valA);
				}

				// fallback coerce to numbers
				const numA = Number(valA);
				const numB = Number(valB);
				if (!isNaN(numA) && !isNaN(numB)) {
					return sortDirection === 'asc' ? numA - numB : numB - numA;
				}

				return 0;
			});
		}

		return result;
	});

	let paginatedPolicies = $derived(filteredPolicies.slice((currentPage - 1) * 10, currentPage * 10));

	$effect(() => {
		// Reset to page 1 when search or filter criteria change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		searchQuery;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterLeaveType;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterEmploymentType;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterStatus;
		currentPage = 1;
	});

	let totalPolicies = $derived(data.policies.length);
	let activePoliciesCount = $derived(data.policies.filter((p) => p.status).length);
</script>

<svelte:head>
	<title>Leave Policies | HRMS</title>
</svelte:head>

<div class="w-full space-y-8 px-1 py-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Leave Policy Master</h1>
			<p class="text-muted-foreground">
				Map leave categories to quotas and employment rules.
			</p>
		</div>
		<div class="shrink-0">
			<Button onclick={openAddModal}>+ Add Leave Policy</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Total Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-black dark:text-white">{totalPolicies}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Active Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-black dark:text-white">{activePoliciesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center w-full">
			<div class="relative flex-1">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by leave type or employment type..."
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

			<!-- Leave Type Filter -->
			<div class="relative w-full md:w-48 shrink-0">
				<select
					bind:value={filterLeaveType}
					class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none appearance-none cursor-pointer"
				>
					<option value="all">All Leave Types</option>
					{#each data.leaveTypes as type (type.cuid)}
						<option value={type.cuid}>{type.leave_name}</option>
					{/each}
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.24 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
				</svg>
			</div>

			<!-- Employment Type Filter -->
			<div class="relative w-full md:w-52 shrink-0">
				<select
					bind:value={filterEmploymentType}
					class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none appearance-none cursor-pointer"
				>
					<option value="all">All Employment Types</option>
					{#each data.employmentTypes as type (type.cuid)}
						<option value={type.cuid}>{type.employment_name}</option>
					{/each}
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.24 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
				</svg>
			</div>

			<!-- Status Filter -->
			<div class="relative w-full md:w-36 shrink-0">
				<select
					bind:value={filterStatus}
					class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none appearance-none cursor-pointer"
				>
					<option value="all">All Statuses</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.24 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
				</svg>
			</div>
		</div>

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('leave_type_cuid')}
								class="flex items-center gap-1 cursor-pointer select-none group"
							>
								<span>Leave Type</span>
								<span class="text-[10px] transition-colors {sortKey === 'leave_type_cuid' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'leave_type_cuid' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('employment_type_cuids')}
								class="flex items-center gap-1 cursor-pointer select-none group"
							>
								<span>Employment Types</span>
								<span class="text-[10px] transition-colors {sortKey === 'employment_type_cuids' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'employment_type_cuids' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-right">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('annual_quota')}
								class="flex items-center justify-end gap-1 cursor-pointer select-none group"
							>
								<span>Quota (Annual)</span>
								<span class="text-[10px] transition-colors {sortKey === 'annual_quota' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'annual_quota' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('carry_forward_allowed')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Carry Fwd</span>
								<span class="text-[10px] transition-colors {sortKey === 'carry_forward_allowed' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'carry_forward_allowed' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('allow_half_day')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Half Day</span>
								<span class="text-[10px] transition-colors {sortKey === 'allow_half_day' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'allow_half_day' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('gender_specific')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Gender</span>
								<span class="text-[10px] transition-colors {sortKey === 'gender_specific' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'gender_specific' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('status')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Status</span>
								<span class="text-[10px] transition-colors {sortKey === 'status' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredPolicies.length === 0}
						<TableRow>
							<TableCell colspan={8} class="py-12 text-center text-muted-foreground">
								No leave policies found.
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedPolicies as policy (policy.cuid)}
							<TableRow>
								<TableCell class="font-semibold">{getLeaveTypeName(policy.leave_type_cuid)}</TableCell>
								<TableCell class="text-xs">{getEmploymentTypeNames(policy.employment_type_cuids)}</TableCell>
								<TableCell class="text-right font-mono font-semibold">{policy.annual_quota}</TableCell>
								<TableCell class="text-center text-xs">
									{#if policy.carry_forward_allowed}
										Yes ({policy.max_carry_forward_days})
									{:else}
										No
									{/if}
								</TableCell>
								<TableCell class="text-center text-xs">
									{#if policy.allow_half_day}
										Allowed
									{:else}
										No
									{/if}
								</TableCell>
								<TableCell class="text-center text-xs capitalize">
									{#if policy.gender_specific}
										{policy.applicable_gender}
									{:else}
										All
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if policy.status}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 shadow-xs select-none mx-auto">
											Active
										</span>
									{:else}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 shadow-xs select-none mx-auto">
											Inactive
										</span>
									{/if}
								</TableCell>
								<TableCell class="text-right relative">
									<Button
										variant="ghost"
										size="icon-sm"
										class="h-8 w-8"
										onclick={(e) => toggleMenu(policy.cuid, e)}
									>
										<EllipsisVerticalIcon class="size-4" />
									</Button>
									{#if activeMenuCuid === policy.cuid}
										<div
											style="position: fixed; top: {menuPosition.top}px; left: {menuPosition.left}px;"
											class="z-50 w-28 rounded-md border bg-popover text-popover-foreground shadow-md outline-none text-left"
										>
											<div class="py-1">
												<a
													href={resolve(('/leave-policies?edit=' + policy.cuid) as '/leave-policies')}
													class="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
													onclick={() => activeMenuCuid = null}
												>
													Edit
												</a>
											</div>
										</div>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		
		<Pagination totalItems={filteredPolicies.length} bind:currentPage={currentPage} />
	</div>
</div>

<FormModal
	bind:isOpen={isFormModalOpen}
	title={editUuid ? 'Edit Leave Policy' : 'Add Leave Policy'}
	onsubmit={handleSubmit}
	onCloseRequest={handleCloseRequest}
	disableEscape={isDiscardModalOpen}
>
	{#if editUuid}
		<input type="hidden" name="cuid" value={editUuid} />
	{/if}

	<!-- Leave Type Dropdown -->
	<div class="space-y-2">
		<Label for="modal_leave_type_cuid" class={(form && 'field' in form && form.field === 'leave_type_cuid') || leaveTypeIdError ? 'text-destructive' : ''}>Leave Type <span class="text-destructive">*</span></Label>
		<select
			id="modal_leave_type_cuid"
			name="leave_type_cuid"
			bind:value={leaveTypeId}
			onchange={() => {
				if (form && form.field === 'leave_type_cuid') form = null;
				const err = getLeaveTypeIdError(leaveTypeId);
				if (!err) {
					errors.leave_type_cuid = '';
				} else if (submissionAttempted || errors.leave_type_cuid) {
					errors.leave_type_cuid = err;
				}
			}}
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {(form && 'field' in form && form.field === 'leave_type_cuid') || leaveTypeIdError ? 'border-destructive focus-visible:ring-destructive' : ''}"
			required
		>
			<option value="">Select Leave Type</option>
			{#each data.leaveTypes.filter((t) => t.status || (editingPolicy && editingPolicy.leave_type_cuid === t.cuid)) as type (type.cuid)}
				<option value={type.cuid}>{type.leave_name}</option>
			{/each}
		</select>
		{#if leaveTypeIdError}
			<p class="text-xs font-medium text-destructive mt-1">{leaveTypeIdError}</p>
		{:else if form && 'field' in form && form.field === 'leave_type_cuid'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Employment Types -->
	<div class="space-y-2">
		<Label class={(form && 'field' in form && form.field === 'employment_type_cuids') || employmentTypesError ? 'text-destructive' : ''}>Applicable Employment Types <span class="text-destructive">*</span></Label>
		<div class="border rounded-md p-3 space-y-2 max-h-36 overflow-y-auto bg-transparent">
			{#each data.employmentTypes.filter((et) => et.status || (editingPolicy && editingPolicy.employment_type_cuids.includes(et.cuid))) as empType (empType.cuid)}
				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						name="employment_type_cuids"
						value={empType.cuid}
						checked={selectedEmploymentTypes.includes(empType.cuid)}
						onchange={() => {
							toggleEmploymentType(empType.cuid);
							if (form && form.field === 'employment_type_cuids') form = null;
							const err = getEmploymentTypesError(selectedEmploymentTypes);
							if (!err) {
								errors.employment_type_cuids = '';
							} else if (submissionAttempted || errors.employment_type_cuids) {
								errors.employment_type_cuids = err;
							}
						}}
						class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
					/>
					<Label class="cursor-pointer select-none font-normal text-xs">{empType.employment_name}</Label>
				</div>
			{/each}
		</div>
		{#if employmentTypesError}
			<p class="text-xs font-medium text-destructive mt-1">{employmentTypesError}</p>
		{:else if form && 'field' in form && form.field === 'employment_type_cuids'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div class="space-y-2">
			<Label for="modal_annual_quota" class={(form && 'field' in form && form.field === 'annual_quota') || quotaError ? 'text-destructive' : ''}>Annual Quota (Days) <span class="text-destructive">*</span></Label>
			<Input
				id="modal_annual_quota"
				name="annual_quota"
				bind:value={annualQuota}
				oninput={() => {
					if (form && form.field === 'annual_quota') form = null;
					const err = getQuotaError(annualQuota);
					if (!err) {
						errors.annual_quota = '';
					} else if (submissionAttempted || errors.annual_quota) {
						errors.annual_quota = err;
					}
					const mErr = getMaxPerMonthError(maxPerMonth, annualQuota);
					if (!mErr) {
						errors.max_per_month = '';
					} else if (submissionAttempted || errors.max_per_month) {
						errors.max_per_month = mErr;
					}
				}}
				placeholder="e.g. 12 or 1.5"
				required
				class={(form && 'field' in form && form.field === 'annual_quota') || quotaError ? 'border-destructive focus-visible:ring-destructive' : ''}
			/>
			{#if quotaError}
				<p class="text-xs font-medium text-destructive mt-1">{quotaError}</p>
			{:else if form && 'field' in form && form.field === 'annual_quota'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="modal_max_per_month" class={(form && 'field' in form && form.field === 'max_per_month') || maxPerMonthError ? 'text-destructive' : ''}>Max Per Month (Optional)</Label>
			<Input
				id="modal_max_per_month"
				name="max_per_month"
				bind:value={maxPerMonth}
				oninput={() => {
					if (form && form.field === 'max_per_month') form = null;
					const err = getMaxPerMonthError(maxPerMonth, annualQuota);
					if (!err) {
						errors.max_per_month = '';
					} else if (submissionAttempted || errors.max_per_month) {
						errors.max_per_month = err;
					}
				}}
				placeholder="e.g. 2"
				class={(form && 'field' in form && form.field === 'max_per_month') || maxPerMonthError ? 'border-destructive focus-visible:ring-destructive' : ''}
			/>
			{#if maxPerMonthError}
				<p class="text-xs font-medium text-destructive mt-1">{maxPerMonthError}</p>
			{:else if form && 'field' in form && form.field === 'max_per_month'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>
	</div>

	<!-- Carry Forward Options -->
	<div class="flex items-center space-x-2 pt-2">
		<input
			type="checkbox"
			id="modal_carry_forward_allowed"
			name="carry_forward_allowed"
			bind:checked={carryForwardAllowed}
			onchange={() => {
				if (form && form.field === 'carry_forward_allowed') form = null;
				if (!carryForwardAllowed) {
					errors.max_carry_forward_days = '';
				} else {
					const err = getCarryForwardDaysError(carryForwardAllowed, maxCarryForwardDays);
					if (!err) {
						errors.max_carry_forward_days = '';
					} else if (submissionAttempted || errors.max_carry_forward_days) {
						errors.max_carry_forward_days = err;
					}
				}
			}}
			class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
		/>
		<Label for="modal_carry_forward_allowed" class="cursor-pointer select-none">Carry Forward Allowed</Label>
	</div>

	{#if carryForwardAllowed}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_max_carry_forward_days" class={(form && 'field' in form && form.field === 'max_carry_forward_days') || carryForwardDaysError ? 'text-destructive' : ''}>Max Carry Forward Days <span class="text-destructive">*</span></Label>
			<Input
				id="modal_max_carry_forward_days"
				name="max_carry_forward_days"
				bind:value={maxCarryForwardDays}
				oninput={() => {
					if (form && form.field === 'max_carry_forward_days') form = null;
					const err = getCarryForwardDaysError(carryForwardAllowed, maxCarryForwardDays);
					if (!err) {
						errors.max_carry_forward_days = '';
					} else if (submissionAttempted || errors.max_carry_forward_days) {
						errors.max_carry_forward_days = err;
					}
				}}
				placeholder="e.g. 5"
				required={carryForwardAllowed}
				class={(form && 'field' in form && form.field === 'max_carry_forward_days') || carryForwardDaysError ? 'border-destructive focus-visible:ring-destructive' : ''}
			/>
			{#if carryForwardDaysError}
				<p class="text-xs font-medium text-destructive mt-1">{carryForwardDaysError}</p>
			{:else if form && 'field' in form && form.field === 'max_carry_forward_days'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>
	{/if}

	<!-- Other Checkboxes -->
	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_allow_half_day" name="allow_half_day" bind:checked={allowHalfDay} onchange={() => { if (form && form.field === 'allow_half_day') form = null; errors.allow_half_day = ''; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_allow_half_day" class="cursor-pointer select-none">Allow Half Day</Label>
	</div>

	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_requires_document" name="requires_document" bind:checked={requiresDocument} onchange={() => { if (form && form.field === 'requires_document') form = null; errors.requires_document = ''; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_requires_document" class="cursor-pointer select-none">Requires Document Attachment</Label>
	</div>

	<!-- Gender Specific Rules -->
	<div class="flex items-center space-x-2">
		<input
			type="checkbox"
			id="modal_gender_specific"
			name="gender_specific"
			bind:checked={genderSpecific}
			onchange={() => {
				if (form && form.field === 'gender_specific') form = null;
				if (!genderSpecific) {
					errors.applicable_gender = '';
				} else {
					const err = getGenderError(genderSpecific, applicableGender);
					if (!err) {
						errors.applicable_gender = '';
					} else if (submissionAttempted || errors.applicable_gender) {
						errors.applicable_gender = err;
					}
				}
			}}
			class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
		/>
		<Label for="modal_gender_specific" class="cursor-pointer select-none">Gender Specific Leave</Label>
	</div>

	{#if genderSpecific}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_applicable_gender" class={(form && 'field' in form && form.field === 'applicable_gender') || genderError ? 'text-destructive' : ''}>Applicable Gender <span class="text-destructive">*</span></Label>
			<select
				id="modal_applicable_gender"
				name="applicable_gender"
				bind:value={applicableGender}
				onchange={() => {
					if (form && form.field === 'applicable_gender') form = null;
					const err = getGenderError(genderSpecific, applicableGender);
					if (!err) {
						errors.applicable_gender = '';
					} else if (submissionAttempted || errors.applicable_gender) {
						errors.applicable_gender = err;
					}
				}}
				required={genderSpecific}
				class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {(form && 'field' in form && form.field === 'applicable_gender') || genderError ? 'border-destructive focus-visible:ring-destructive' : ''}"
			>
				<option value="">Select Gender</option>
				<option value="Male">Male</option>
				<option value="Female">Female</option>
				<option value="Others">Others</option>
			</select>
			{#if genderError}
				<p class="text-xs font-medium text-destructive mt-1">{genderError}</p>
			{:else if form && 'field' in form && form.field === 'applicable_gender'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
		<!-- Min Service Days -->
		<div class="space-y-2">
			<Label for="modal_min_service_days" class={(form && 'field' in form && form.field === 'min_service_days') || minServiceDaysError ? 'text-destructive' : ''}>Min Service Days (Active service req.) <span class="text-destructive">*</span></Label>
			<Input
				id="modal_min_service_days"
				name="min_service_days"
				bind:value={minServiceDays}
				oninput={() => {
					if (form && form.field === 'min_service_days') form = null;
					const err = getMinServiceDaysError(minServiceDays);
					if (!err) {
						errors.min_service_days = '';
					} else if (submissionAttempted || errors.min_service_days) {
						errors.min_service_days = err;
					}
				}}
				placeholder="e.g. 90"
				class={(form && 'field' in form && form.field === 'min_service_days') || minServiceDaysError ? 'border-destructive focus-visible:ring-destructive' : ''}
			/>
			{#if minServiceDaysError}
				<p class="text-xs font-medium text-destructive mt-1">{minServiceDaysError}</p>
			{:else if form && 'field' in form && form.field === 'min_service_days'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>

		<!-- Status Dropdown -->
		<div class="space-y-2">
			<Label for="modal_status">Status <span class="text-destructive">*</span></Label>
			<select
				id="modal_status"
				name="status"
				bind:value={status}
				onchange={() => {
					if (form && form.field === 'status') form = null;
					errors.status = '';
				}}
				class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none"
				required
			>
				<option value={true}>Active</option>
				<option value={false}>Inactive</option>
			</select>
		</div>
	</div>

	<!-- Alert Errors -->
	{#if formError && (!form || !('field' in form) || !form.field)}
		<div transition:slide>
			<Alert variant="destructive">
				<AlertDescription>{formError}</AlertDescription>
			</Alert>
		</div>
	{/if}

	<Button type="submit" class="w-full" disabled={isSubmitDisabled}>
		{#if isSubmitting}
			<LoaderCircleIcon class="size-4 animate-spin" />
			Saving...
		{:else}
			{editUuid ? 'Update Leave Policy' : 'Save Leave Policy'}
		{/if}
	</Button>
</FormModal>

<ConfirmModal
	bind:isOpen={isDiscardModalOpen}
	title="Unsaved Changes"
	message="You have unsaved changes. Are you sure you want to discard them? Any unsaved edits will be lost."
	confirmLabel="Discard Changes"
	cancelLabel="Continue Editing"
	variant="destructive"
	onConfirm={confirmDiscard}
/>



