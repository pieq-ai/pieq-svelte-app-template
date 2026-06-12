<script lang="ts">
	import { validateEmploymentTypeName } from '$lib/validators/employment-type.js';
	import { slide } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll, beforeNavigate } from '$app/navigation';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
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
		MultiSelect
	} from '$lib/components/ui';
	import { ConfirmModal, CrudModal, Pagination, TableActions, FilterDropdown, StatusDropdown, StatusBadge } from '$lib/components';
	import type { PageData } from './$types.js';
	import type { EmploymentType } from './+page.js';

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
	let filterStatus = $state<'all' | boolean>('all');

	let filterLeaveTypeOptions = $derived([
		{ value: 'all', label: 'All Leave Types' },
		...data.leaveTypes.map(type => ({ value: type.cuid, label: type.leave_name }))
	]);

	let filterEmploymentTypeOptions = $derived([
		{ value: 'all', label: 'All Employment Types' },
		...data.employmentTypes.map(type => ({ value: type.cuid, label: type.employment_name }))
	]);
	let modalLeaveTypeOptions = $derived([
		...data.leaveTypes
			.filter((t) => t.status || (editingPolicy && editingPolicy.leave_type_cuid === t.cuid))
			.map(type => ({ value: type.cuid, label: type.leave_name }))
	]);

	const genderOptions = [
		{ value: 'Male', label: 'Male' },
		{ value: 'Female', label: 'Female' },
		{ value: 'Others', label: 'Others' }
	] as const;

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



	function openAddModal() {
		leaveTypeId = '';
		selectedEmploymentTypes = [];
		annualLimit = '';
		maxPerMonth = '';
		carryForwardAllowed = false;
		maxCarryForwardDays = '';
		documentRequired = false;
		documentRequiredAfterDays = '';
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

		// Rebuild validation error state from scratch on Save
		errors = {};

		// Validate all fields client-side simultaneously
		const leaveTypeErr = getLeaveTypeIdError(leaveTypeId);
		const empTypesErr = getEmploymentTypesError(selectedEmploymentTypes);
		const quotaErr = getQuotaError(annualLimit);
		const maxPerMonthErr = getMaxPerMonthError(maxPerMonth, annualLimit);
		const carryForwardErr = getCarryForwardDaysError(carryForwardAllowed, maxCarryForwardDays);
		const documentRequiredAfterDaysErr = getDocumentRequiredAfterDaysError(documentRequired, documentRequiredAfterDays);
		const minServiceErr = getMinServiceDaysError(minServiceDays);
		const genderErr = getGenderError(genderSpecific, applicableGender);

		errors.leave_type_cuid = leaveTypeErr;
		errors.employment_type_cuids = empTypesErr;
		errors.annual_limit = quotaErr;
		errors.max_per_month = maxPerMonthErr;
		errors.max_carry_forward_days = carryForwardErr;
		errors.document_required_after_days = documentRequiredAfterDaysErr;
		errors.min_service_days = minServiceErr;
		errors.applicable_gender = genderErr;

		if (
			leaveTypeErr ||
			empTypesErr ||
			quotaErr ||
			maxPerMonthErr ||
			carryForwardErr ||
			documentRequiredAfterDaysErr ||
			minServiceErr ||
			genderErr
		) {
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			leave_type_cuid: leaveTypeId,
			employment_type_cuids: selectedEmploymentTypes,
			annual_limit: annualLimit,
			max_per_month: maxPerMonth || null,
			carry_forward_allowed: carryForwardAllowed,
			max_carry_forward_days: carryForwardAllowed ? maxCarryForwardDays : null,
			document_required: documentRequired,
			document_required_after_days: documentRequired ? (documentRequiredAfterDays === '' ? null : Number(documentRequiredAfterDays)) : null,
			min_service_days: minServiceDays,
			allow_half_day: allowHalfDay,
			gender_specific: genderSpecific,
			applicable_gender: genderSpecific ? applicableGender : null,
			status: status
		};

		try {
			const url = editUuid ? `/api/leave/policies/${editUuid}` : '/api/leave/policies';
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
					annualLimit = '';
					maxPerMonth = '';
					carryForwardAllowed = false;
					maxCarryForwardDays = '';
					documentRequired = false;
					documentRequiredAfterDays = '';
					minServiceDays = '0';
					allowHalfDay = false;
					genderSpecific = false;
					applicableGender = '';
					status = true;
				}
				await invalidateAll();
			} else {
				if (result.data?.error && typeof result.data.error === 'object') {
					errors = { ...result.data.error };
					if (result.data.error.general) {
						form = {
							error: result.data.error.general,
							field: undefined,
							action: editUuid ? 'update' : 'create'
						};
					} else {
						form = null;
					}
				} else if (result.error && typeof result.error === 'object') {
					errors = { ...result.error };
					if (result.error.general) {
						form = {
							error: result.error.general,
							field: undefined,
							action: editUuid ? 'update' : 'create'
						};
					} else {
						form = null;
					}
				} else if (result.data?.errors) {
					errors = { ...result.data.errors };
					form = null;
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
			}
		} catch (error) {
			console.error('Submit failed:', error);
			errors.general = 'An unexpected error occurred.';
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
	let annualLimit = $state('');
	let maxPerMonth = $state('');
	let carryForwardAllowed = $state(false);
	let maxCarryForwardDays = $state('');
	let documentRequired = $state(false);
	let documentRequiredAfterDays = $state('');
	let minServiceDays = $state('');
	let allowHalfDay = $state(false);
	let genderSpecific = $state(false);
	let applicableGender = $state<'Male' | 'Female' | 'Others' | ''>('');
	let status = $state(true);

	let localEmploymentTypes = $state<EmploymentType[]>([]);
	let empSearchQuery = $state('');

	$effect(() => {
		if (data.employmentTypes) {
			localEmploymentTypes = [...data.employmentTypes];
		}
	});

	let dynamicEmploymentOptions = $derived.by(() => {
		return localEmploymentTypes
			.filter((et) => et.status || (editingPolicy && editingPolicy.employment_type_cuids.includes(et.cuid)))
			.map((et) => ({
				id: et.cuid,
				label: et.employment_name
			}));
	});

	let isAddEmpModalOpen = $state(false);
	let newEmpName = $state('');
	let newEmpError = $state('');
	let isSavingNewEmp = $state(false);

	async function handleAddEmploymentType(e: Event) {
		e.preventDefault();
		const validationError = validateEmploymentTypeName(newEmpName);
		if (validationError) {
			newEmpError = validationError;
			return;
		}

		isSavingNewEmp = true;
		newEmpError = '';
		try {
			const res = await fetch('/api/master-data/employment-types', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newEmpName })
			});
			const result = await res.json();
			if (res.ok && result.data) {
				toast.success(result.data.message || 'Employment Type created successfully');
				
				const newEmpType: EmploymentType = {
					id: 0,
					cuid: result.data.cuid,
					employment_name: newEmpName,
					status: true
				};

				localEmploymentTypes = [...localEmploymentTypes, newEmpType];
				selectedEmploymentTypes = [...selectedEmploymentTypes, result.data.cuid];

				if (errors.employment_type_cuids) {
					errors.employment_type_cuids = '';
				}

				newEmpName = '';
				isAddEmpModalOpen = false;
			} else {
				newEmpError = result.error || 'Failed to create Employment Type';
			}
		} catch (err) {
			console.error('Failed to create Employment Type:', err);
			newEmpError = 'An unexpected error occurred';
		} finally {
			isSavingNewEmp = false;
		}
	}

	let hasChanges = $derived.by(() => {
		if (!editUuid || !editingPolicy) return false;

		const originalMaxPerMonth = editingPolicy.max_per_month !== null ? String(editingPolicy.max_per_month) : '';
		const originalMaxCarryForwardDays = editingPolicy.max_carry_forward_days !== null ? String(editingPolicy.max_carry_forward_days) : '';
		const originalDocumentRequiredAfterDays = editingPolicy.document_required_after_days !== null ? String(editingPolicy.document_required_after_days) : '';
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
			annualLimit.trim() !== String(editingPolicy.annual_limit).trim() ||
			maxPerMonth.trim() !== originalMaxPerMonth.trim() ||
			carryForwardAllowed !== editingPolicy.carry_forward_allowed ||
			maxCarryForwardDays.trim() !== originalMaxCarryForwardDays.trim() ||
			documentRequired !== editingPolicy.document_required ||
			documentRequiredAfterDays.trim() !== originalDocumentRequiredAfterDays.trim() ||
			minServiceDays.trim() !== originalMinServiceDays.trim() ||
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
				annualLimit.trim() !== '' ||
				maxPerMonth.trim() !== '' ||
				carryForwardAllowed !== false ||
				maxCarryForwardDays.trim() !== '' ||
				documentRequired !== false ||
				documentRequiredAfterDays.trim() !== '' ||
				minServiceDays.trim() !== '0' && minServiceDays.trim() !== '' ||
				allowHalfDay !== false ||
				genderSpecific !== false ||
				applicableGender !== '' ||
				status !== true
			);
		}
	});

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		const mandatoryFieldsFilled =
			leaveTypeId.trim() !== '' &&
			selectedEmploymentTypes.length > 0 &&
			annualLimit.trim() !== '' &&
			minServiceDays.trim() !== '' &&
			(!carryForwardAllowed || maxCarryForwardDays.trim() !== '') &&
			(!genderSpecific || applicableGender !== '');
		if (!mandatoryFieldsFilled) return true;
		if (editUuid) {
			return !hasChanges;
		}
		return false;
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
		annualLimit = '';
		maxPerMonth = '';
		carryForwardAllowed = false;
		maxCarryForwardDays = '';
		documentRequired = false;
		documentRequiredAfterDays = '';
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
			errors = {};
			submissionAttempted = false;
		}
	});

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (!isFormModalOpen) return;
		if (hasSynchronized) return;

		if (editingPolicy) {
			leaveTypeId = String(editingPolicy.leave_type_cuid);
			selectedEmploymentTypes = editingPolicy.employment_type_cuids;
			annualLimit = String(editingPolicy.annual_limit);
			maxPerMonth = editingPolicy.max_per_month !== null ? String(editingPolicy.max_per_month) : '';
			carryForwardAllowed = editingPolicy.carry_forward_allowed;
			maxCarryForwardDays = editingPolicy.max_carry_forward_days !== null ? String(editingPolicy.max_carry_forward_days) : '';
			documentRequired = editingPolicy.document_required;
			documentRequiredAfterDays = editingPolicy.document_required_after_days !== null ? String(editingPolicy.document_required_after_days) : '';
			minServiceDays = String(editingPolicy.min_service_days);
			allowHalfDay = editingPolicy.allow_half_day;
			genderSpecific = editingPolicy.gender_specific;
			applicableGender = editingPolicy.applicable_gender || '';
			status = editingPolicy.status;
			hasSynchronized = true;
		} else if (!editUuid) {
			leaveTypeId = '';
			selectedEmploymentTypes = [];
			annualLimit = '';
			maxPerMonth = '';
			carryForwardAllowed = false;
			maxCarryForwardDays = '';
			documentRequired = false;
			documentRequiredAfterDays = '';
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
			annualLimit = '';
			maxPerMonth = '';
			carryForwardAllowed = false;
			maxCarryForwardDays = '';
			documentRequired = false;
			documentRequiredAfterDays = '';
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

	$effect(() => {
		selectedEmploymentTypes;
		untrack(() => {
			errors.employment_type_cuids = '';
		});
	});

	// Form Helper functions for validation on submit

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
		if (!quotaStr || quotaStr.trim() === '') return 'Annual limit is required.';
		const quota = Number(quotaStr);
		if (isNaN(quota) || quota <= 0) {
			return 'Annual limit must be greater than zero';
		}
		return '';
	}

	function getMaxPerMonthError(maxMStr: string, quotaStr: string): string {
		if (!maxMStr || maxMStr.trim() === '') return '';
		const maxM = Number(maxMStr);
		if (isNaN(maxM) || maxM <= 0) {
			return 'Max per month must be greater than zero';
		}
		if (quotaStr) {
			const quota = Number(quotaStr);
			if (!isNaN(quota) && maxM > quota) {
				return 'Max per month cannot exceed annual limit';
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
			return 'Max carry forward days must be greater than zero';
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

	function getDocumentRequiredAfterDaysError(required: boolean, daysStr: string): string {
		if (!required) return '';
		if (!daysStr || String(daysStr).trim() === '') return '';
		const days = Number(daysStr);
		if (isNaN(days) || !Number.isInteger(days) || days <= 0) {
			return 'Document required after days must be greater than zero';
		}
		return '';
	}

	// List helpers and filtering logic

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
			result = result.filter((p) => p.status === filterStatus);
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
	let inactivePoliciesCount = $derived(data.policies.filter((p) => !p.status).length);

	function isInteractive(target: HTMLElement | null, rowElement: HTMLElement): boolean {
		let curr = target;
		while (curr && curr !== rowElement) {
			const tagName = curr.tagName.toLowerCase();
			if (
				tagName === 'a' ||
				tagName === 'button' ||
				tagName === 'input' ||
				tagName === 'select' ||
				tagName === 'textarea' ||
				curr.getAttribute('role') === 'button' ||
				curr.classList.contains('kebab-dropdown-menu')
			) {
				return true;
			}
			curr = curr.parentElement;
		}
		return false;
	}

	function handleRowClick(cuid: string, event: MouseEvent) {
		const target = event.target as HTMLElement;
		const row = event.currentTarget as HTMLElement;
		if (isInteractive(target, row)) return;
		goto(resolve(('/leave-policies?edit=' + cuid) as '/leave-policies'));
	}
</script>

<svelte:head>
	<title>Leave Policies</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Leave Policies</h1>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={openAddModal}
		>
			<PlusIcon class="size-4" />
			Add Leave Policy
		</Button>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Total Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#262626] dark:text-neutral-200">{totalPolicies}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Active Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#F45310]">{activePoliciesCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Inactive Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#800020] dark:text-[#b83d58]">{inactivePoliciesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
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
			<div class="w-full md:w-48 shrink-0">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
								<span class="truncate pr-2">{filterLeaveTypeOptions.find(o => o.value === filterLeaveType)?.label || 'All Leave Types'}</span>
								<FilterIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each filterLeaveTypeOptions as opt}
								<DropdownMenu.Item onclick={() => { filterLeaveType = opt.value; currentPage = 1; }} class="justify-between cursor-pointer {filterLeaveType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
									<span class="truncate pr-2">{opt.label}</span>
									{#if filterLeaveType === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Employment Type Filter -->
			<div class="w-full md:w-52 shrink-0">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
								<span class="truncate pr-2">{filterEmploymentTypeOptions.find(o => o.value === filterEmploymentType)?.label || 'All Employment Types'}</span>
								<FilterIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each filterEmploymentTypeOptions as opt}
								<DropdownMenu.Item onclick={() => { filterEmploymentType = opt.value; currentPage = 1; }} class="justify-between cursor-pointer {filterEmploymentType === opt.value ? 'bg-accent text-accent-foreground' : ''}">
									<span class="truncate pr-2">{opt.label}</span>
									{#if filterEmploymentType === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Status Filter -->
			<FilterDropdown value={filterStatus} onChange={(value) => { filterStatus = value; currentPage = 1; }} />
		</div>

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('leave_type_cuid')}>
								Leave Type
							{#if sortKey === 'leave_type_cuid' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'leave_type_cuid' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold" onclick={() => handleSort('employment_type_cuids')}>
								Employment Types
							{#if sortKey === 'employment_type_cuids' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'employment_type_cuids' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-right font-bold">
							<Button variant="ghost" size="sm" class="-mr-2.5 h-8 ml-auto font-bold" onclick={() => handleSort('annual_limit')}>
								Annual Limit
							{#if sortKey === 'annual_limit' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'annual_limit' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold">
							<Button variant="ghost" size="sm" class="h-8 font-bold" onclick={() => handleSort('carry_forward_allowed')}>
								Carry Fwd
							{#if sortKey === 'carry_forward_allowed' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'carry_forward_allowed' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold">
							<Button variant="ghost" size="sm" class="h-8 font-bold" onclick={() => handleSort('allow_half_day')}>
								Half Day
							{#if sortKey === 'allow_half_day' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'allow_half_day' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold">
							<Button variant="ghost" size="sm" class="h-8 font-bold" onclick={() => handleSort('gender_specific')}>
								Gender
							{#if sortKey === 'gender_specific' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'gender_specific' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold">
							<Button variant="ghost" size="sm" class="h-8 font-bold" onclick={() => handleSort('status')}>
								Status
							{#if sortKey === 'status' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'status' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredPolicies.length === 0}
						<TableRow>
							<TableCell colspan={8} class="py-12 text-center text-muted-foreground">
								No records found
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedPolicies as policy (policy.cuid)}
							<TableRow onclick={(e) => handleRowClick(policy.cuid, e)} class="cursor-pointer">
								<TableCell class="font-normal">{getLeaveTypeName(policy.leave_type_cuid)}</TableCell>
								<TableCell class="font-normal">{getEmploymentTypeNames(policy.employment_type_cuids)}</TableCell>
								<TableCell class="text-right font-normal">{policy.annual_limit}</TableCell>
								<TableCell class="text-center font-normal">
									{#if policy.carry_forward_allowed}
										Yes ({policy.max_carry_forward_days})
									{:else}
										No
									{/if}
								</TableCell>
								<TableCell class="text-center font-normal">
									{#if policy.allow_half_day}
										Allowed
									{:else}
										No
									{/if}
								</TableCell>
								<TableCell class="text-center font-normal capitalize">
									{#if policy.gender_specific}
										{policy.applicable_gender}
									{:else}
										All
									{/if}
								</TableCell>
								<TableCell class="text-center">
									<StatusBadge status={policy.status} />
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										onEdit={() => goto(resolve(('/leave-policies?edit=' + policy.cuid) as '/leave-policies'))}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		
		<Pagination totalItems={filteredPolicies.length} bind:currentPage={currentPage} pageSize={10} />
	</div>
</div>

<CrudModal
	open={isFormModalOpen}
	title={editUuid ? 'Edit Leave Policy' : 'Create Leave Policy'}
	isDirty={hasUnsavedChanges}
	onClose={confirmDiscard}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			{#if editUuid}
				<input type="hidden" name="cuid" value={editUuid} />
			{/if}

			<!-- Leave Type Dropdown -->
			<div class="space-y-2">
				<Label for="modal_leave_type_cuid" class={errors.leave_type_cuid ? 'text-destructive' : ''}>Leave Type <span class="text-destructive">*</span></Label>
				<input type="hidden" id="modal_leave_type_cuid" name="leave_type_cuid" value={leaveTypeId} />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {errors.leave_type_cuid ? 'border-destructive focus:border-destructive focus:ring-destructive/30 focus-visible:ring-destructive/30 data-[state=open]:border-destructive data-[state=open]:ring-destructive/30' : ''}" {...props}>
								<span class="truncate pr-2">{modalLeaveTypeOptions.find(o => o.value === leaveTypeId)?.label || 'Select Leave Type'}</span>
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
						<DropdownMenu.Group>
							{#each modalLeaveTypeOptions as opt}
								<DropdownMenu.Item onclick={() => {
									leaveTypeId = opt.value;
									if (form && form.field === 'leave_type_cuid') form = null;
									errors.leave_type_cuid = '';
									errors.employment_type_cuids = '';
								}} class="justify-between cursor-pointer {leaveTypeId === opt.value ? 'bg-accent text-accent-foreground' : ''}">
									<span class="truncate pr-2">{opt.label}</span>
									{#if leaveTypeId === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				{#if errors.leave_type_cuid}
					<p class="text-xs font-medium text-destructive mt-1">{errors.leave_type_cuid}</p>
				{/if}
			</div>

			<!-- Employment Types -->
			<div class="space-y-2">
				<Label class={errors.employment_type_cuids ? 'text-destructive' : ''}>Applicable Employment Types <span class="text-destructive">*</span></Label>
				<MultiSelect
					options={dynamicEmploymentOptions}
					bind:selectedIds={selectedEmploymentTypes}
					bind:searchQuery={empSearchQuery}
					onAdd={() => (isAddEmpModalOpen = true)}
					addLabel="Add Employment Type"
					placeholder="Select Employment Types"
					name="employment_type_cuids"
				/>
				{#if errors.employment_type_cuids}
					<p class="text-xs font-medium text-destructive mt-1">{errors.employment_type_cuids}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_annual_limit" class={errors.annual_limit ? 'text-destructive' : ''}>Annual Limit (Days) <span class="text-destructive">*</span></Label>
				<Input
					id="modal_annual_limit"
					name="annual_limit"
					bind:value={annualLimit}
					oninput={() => {
						if (form && form.field === 'annual_limit') form = null;
						errors.annual_limit = '';
						errors.max_per_month = '';
					}}
					placeholder="e.g. 12 or 1.5"
					required
					class={errors.annual_limit ? 'border-destructive focus-visible:ring-destructive/30' : ''}
				/>
				{#if errors.annual_limit}
					<p class="text-xs font-medium text-destructive mt-1">{errors.annual_limit}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="modal_max_per_month" class={errors.max_per_month ? 'text-destructive' : ''}>Max Per Month (Optional)</Label>
				<Input
					id="modal_max_per_month"
					name="max_per_month"
					bind:value={maxPerMonth}
					oninput={() => {
						if (form && form.field === 'max_per_month') form = null;
						errors.max_per_month = '';
					}}
					placeholder="e.g. 2"
					class={errors.max_per_month ? 'border-destructive focus-visible:ring-destructive/30' : ''}
				/>
				{#if errors.max_per_month}
					<p class="text-xs font-medium text-destructive mt-1">{errors.max_per_month}</p>
				{/if}
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
						errors.max_carry_forward_days = '';
					}}
					class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
				/>
				<Label for="modal_carry_forward_allowed" class="cursor-pointer select-none">Carry Forward Allowed</Label>
			</div>

			{#if carryForwardAllowed}
				<div transition:slide class="space-y-2 pl-4">
					<Label for="modal_max_carry_forward_days" class={errors.max_carry_forward_days ? 'text-destructive' : ''}>Max Carry Forward Days <span class="text-destructive">*</span></Label>
					
					<Input
						id="modal_max_carry_forward_days"
						name="max_carry_forward_days"
						bind:value={maxCarryForwardDays}
						oninput={() => {
							if (form && form.field === 'max_carry_forward_days') form = null;
							errors.max_carry_forward_days = '';
						}}
						placeholder="e.g. 5"
						required={carryForwardAllowed}
						class={errors.max_carry_forward_days ? 'border-destructive focus-visible:ring-destructive/30' : ''}
					/>
					{#if errors.max_carry_forward_days}
						<p class="text-xs font-medium text-destructive mt-1">{errors.max_carry_forward_days}</p>
					{/if}
				</div>
			{/if}

			<!-- Other Checkboxes -->
			<div class="flex items-center space-x-2">
				<input type="checkbox" id="modal_allow_half_day" name="allow_half_day" bind:checked={allowHalfDay} onchange={() => { if (form && form.field === 'allow_half_day') form = null; errors.allow_half_day = ''; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
				<Label for="modal_allow_half_day" class="cursor-pointer select-none">Allow Half Day</Label>
			</div>

			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="modal_document_required"
					name="document_required"
					bind:checked={documentRequired}
					onchange={() => {
						if (form && form.field === 'document_required') form = null;
						errors.document_required = '';
						errors.document_required_after_days = '';
						if (!documentRequired) {
							documentRequiredAfterDays = '';
						}
					}}
					class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
				/>
				<Label for="modal_document_required" class="cursor-pointer select-none">Document Required</Label>
			</div>

			{#if documentRequired}
				<div transition:slide class="space-y-2 pl-4">
					<Label for="modal_document_required_after_days" class={errors.document_required_after_days ? 'text-destructive' : ''}>Document Required After (Days)<span class="text-destructive">*</span></Label>
					<Input
						id="modal_document_required_after_days"
						name="document_required_after_days"
						bind:value={documentRequiredAfterDays}
						oninput={() => {
							if (form && form.field === 'document_required_after_days') form = null;
							errors.document_required_after_days = '';
						}}
						placeholder="Document becomes mandatory after these days."
						class={errors.document_required_after_days ? 'border-destructive focus-visible:ring-destructive/30' : ''}
					/>
					{#if errors.document_required_after_days}
						<p class="text-xs font-medium text-destructive mt-1">{errors.document_required_after_days}</p>
					{/if}
				</div>
			{/if}

			<!-- Gender Specific Rules -->
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="modal_gender_specific"
					name="gender_specific"
					bind:checked={genderSpecific}
					onchange={() => {
						if (form && form.field === 'gender_specific') form = null;
						errors.applicable_gender = '';
					}}
					class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
				/>
				<Label for="modal_gender_specific" class="cursor-pointer select-none">Gender Specific Leave</Label>
			</div>

			{#if genderSpecific}
				<div transition:slide class="space-y-2 pl-4">
					<Label for="modal_applicable_gender" class={errors.applicable_gender ? 'text-destructive' : ''}>Applicable Gender <span class="text-destructive">*</span></Label>
					<input type="hidden" id="modal_applicable_gender" name="applicable_gender" value={applicableGender} />
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {errors.applicable_gender ? 'border-destructive focus:border-destructive focus:ring-destructive/30 focus-visible:ring-destructive/30 data-[state=open]:border-destructive data-[state=open]:ring-destructive/30' : ''}" {...props}>
									<span class="truncate pr-2">{genderOptions.find(o => o.value === applicableGender)?.label || 'Select Gender'}</span>
									<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)]">
							<DropdownMenu.Group>
								{#each genderOptions as opt}
									<DropdownMenu.Item onclick={() => {
										applicableGender = opt.value;
										if (form && form.field === 'applicable_gender') form = null;
										errors.applicable_gender = '';
									}} class="justify-between cursor-pointer {applicableGender === opt.value ? 'bg-accent text-accent-foreground' : ''}">
										<span class="truncate pr-2">{opt.label}</span>
										{#if applicableGender === opt.value}<CheckIcon class="size-4 shrink-0" />{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					{#if errors.applicable_gender}
						<p class="text-xs font-medium text-destructive mt-1">{errors.applicable_gender}</p>
					{/if}
				</div>
			{/if}

			<!-- Min Service Days -->
			<div class="space-y-2">
				<Label for="modal_min_service_days" class={errors.min_service_days ? 'text-destructive' : ''}>Min Service Days (Active service req.) <span class="text-destructive">*</span></Label>
				<Input
					id="modal_min_service_days"
					name="modal_min_service_days"
					bind:value={minServiceDays}
					oninput={() => {
						if (form && form.field === 'min_service_days') form = null;
						errors.min_service_days = '';
					}}
					placeholder="e.g. 90"
					class={errors.min_service_days ? 'border-destructive focus-visible:ring-destructive/30' : ''}
				/>
				{#if errors.min_service_days}
					<p class="text-xs font-medium text-destructive mt-1">{errors.min_service_days}</p>
				{/if}
			</div>

			<!-- Status Dropdown -->
			<div class="pb-2">
				<StatusDropdown
					id="modal_status"
					name="status"
					value={status}
					onChange={(val) => {
						status = val;
						if (form && form.field === 'status') form = null;
						errors.status = '';
					}}
				/>
				{#if errors.status}
					<p class="text-xs font-medium text-destructive mt-1">{errors.status}</p>
				{/if}
			</div>

			<!-- Alert Errors -->
			{#if formError && (!form || !('field' in form) || !form.field)}
				<div transition:slide>
					<Alert variant="destructive">
						<AlertDescription>{formError}</AlertDescription>
					</Alert>
				</div>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-6">
				<Button
					type="button"
					variant="outline"
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
					onclick={cancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium bg-[#F45310] text-white hover:bg-[#F45310]/90"
					disabled={isSubmitDisabled}
				>
					{#if isSubmitting}
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

<ConfirmModal
	open={isDiscardModalOpen}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	confirmLabel="Keep Editing"
	onCancel={confirmDiscard}
	onConfirm={() => (isDiscardModalOpen = false)}
/>

<CrudModal
	open={isAddEmpModalOpen}
	title="Add Employment Type"
	description="Create a new employment type master record."
	isDirty={newEmpName.trim() !== ''}
	onClose={() => {
		isAddEmpModalOpen = false;
		newEmpName = '';
		newEmpError = '';
	}}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleAddEmploymentType}>
			<div class="space-y-2">
				<Label for="new_emp_name" class={newEmpError ? 'text-destructive' : ''}>Employment Type Name <span class="text-destructive">*</span></Label>
				<Input
					id="new_emp_name"
					bind:value={newEmpName}
					class={newEmpError ? 'border-destructive focus-visible:ring-destructive/30' : ''}
					placeholder="e.g. Contract, Part-Time"
					oninput={() => { newEmpError = ''; }}
				/>
				{#if newEmpError}
					<p class="text-xs font-medium text-destructive mt-1">{newEmpError}</p>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 pt-6">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSavingNewEmp}>Cancel</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSavingNewEmp || !newEmpName.trim()}>
					{#if isSavingNewEmp}
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



