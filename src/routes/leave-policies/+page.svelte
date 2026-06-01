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
		FormModal
	} from '$lib/components/ui';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let searchQuery = $state('');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

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
		isSubmitting = true;
		form = null;

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
			const url = editUuid ? `/api/leave/policies/${editUuid}` : '/api/leave/policies';
			const res = await fetch(url, {
				method: editUuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json();

			if (res.ok && result.success) {
				toast.success(
					editUuid
						? 'Leave policy updated successfully!'
						: 'Leave policy created successfully!'
				);
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
				form = {
					error: result.message || 'Validation failed',
					field: result.field,
					action: editUuid ? 'update' : 'create'
				};
				toast.error(result.message || 'Validation failed');
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
		if (
			!!quotaError ||
			!!maxPerMonthError ||
			!!carryForwardDaysError ||
			!!minServiceDaysError ||
			!!genderError ||
			!!employmentTypesError
		) {
			return true;
		}

		// Required fields empty checks
		if (!leaveTypeId || selectedEmploymentTypes.length === 0 || !annualQuota || !minServiceDays) {
			return true;
		}
		if (genderSpecific && !applicableGender) {
			return true;
		}
		if (carryForwardAllowed && !maxCarryForwardDays) {
			return true;
		}

		if (editUuid) {
			return !hasChanges;
		} else {
			return false;
		}
	});

	let isDiscardModalOpen = $state(false);
	let pendingNavigation = $state<any>(null);
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
				await goto(target);
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

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (form && 'error' in form) {
			return;
		}
		if (form && 'action' in form && form.action === 'update' && 'cuid' in form && form.cuid === editUuid) {
			if ('leave_type_cuid' in form) leaveTypeId = String(form.leave_type_cuid);
			if ('employment_type_cuids' in form) selectedEmploymentTypes = form.employment_type_cuids as string[];
			if ('annual_quota' in form) annualQuota = String(form.annual_quota);
			if ('max_per_month' in form) maxPerMonth = String(form.max_per_month);
			if ('carry_forward_allowed' in form) carryForwardAllowed = Boolean(form.carry_forward_allowed);
			if ('max_carry_forward_days' in form) maxCarryForwardDays = String(form.max_carry_forward_days);
			if ('requires_document' in form) requiresDocument = Boolean(form.requires_document);
			if ('min_service_days' in form) minServiceDays = String(form.min_service_days);
			if ('allow_half_day' in form) allowHalfDay = Boolean(form.allow_half_day);
			if ('gender_specific' in form) genderSpecific = Boolean(form.gender_specific);
			if ('applicable_gender' in form) applicableGender = form.applicable_gender as 'Male' | 'Female' | 'Others' | '';
			if ('status' in form) status = Boolean(form.status);
		} else if (form && 'action' in form && form.action === 'create' && !editUuid) {
			if ('leave_type_cuid' in form) leaveTypeId = String(form.leave_type_cuid);
			if ('employment_type_cuids' in form) selectedEmploymentTypes = form.employment_type_cuids as string[];
			if ('annual_quota' in form) annualQuota = String(form.annual_quota);
			if ('max_per_month' in form) maxPerMonth = String(form.max_per_month);
			if ('carry_forward_allowed' in form) carryForwardAllowed = Boolean(form.carry_forward_allowed);
			if ('max_carry_forward_days' in form) maxCarryForwardDays = String(form.max_carry_forward_days);
			if ('requires_document' in form) requiresDocument = Boolean(form.requires_document);
			if ('min_service_days' in form) minServiceDays = String(form.min_service_days);
			if ('allow_half_day' in form) allowHalfDay = Boolean(form.allow_half_day);
			if ('gender_specific' in form) genderSpecific = Boolean(form.gender_specific);
			if ('applicable_gender' in form) applicableGender = form.applicable_gender as 'Male' | 'Female' | 'Others' | '';
			if ('status' in form) status = Boolean(form.status);
		} else if (editingPolicy) {
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
			if (editUuid) {
				goto(resolve('/leave-policies'), { replaceState: true });
			}
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	// Client-side validations
	let quotaError = $derived.by(() => {
		if (!annualQuota) return '';
		const quota = Number(annualQuota);
		if (isNaN(quota) || quota < 0) {
			return 'Annual quota must be a positive number';
		}
		return '';
	});

	let maxPerMonthError = $derived.by(() => {
		if (!maxPerMonth) return '';
		const maxM = Number(maxPerMonth);
		if (isNaN(maxM) || maxM < 0) {
			return 'Max per month must be a positive number';
		}
		if (annualQuota) {
			const quota = Number(annualQuota);
			if (!isNaN(quota) && maxM > quota) {
				return 'Max per month cannot exceed annual quota';
			}
		}
		return '';
	});

	let carryForwardDaysError = $derived.by(() => {
		if (!carryForwardAllowed) return '';
		if (!maxCarryForwardDays || String(maxCarryForwardDays).trim() === '') return 'Max carry forward days is required when carry forward is allowed';
		const days = Number(maxCarryForwardDays);
		if (isNaN(days) || days <= 0) {
			return 'Max carry forward days must be greater than 0';
		}
		return '';
	});

	let minServiceDaysError = $derived.by(() => {
		if (!minServiceDays) return '';
		const days = Number(minServiceDays);
		if (isNaN(days) || !Number.isInteger(days) || days < 0) {
			return 'Min service days must be a positive integer';
		}
		return '';
	});

	let genderError = $derived.by(() => {
		if (genderSpecific && !applicableGender) {
			return 'Applicable gender is required when gender specific is enabled';
		}
		return '';
	});

	let employmentTypesError = $derived.by(() => {
		if (selectedEmploymentTypes.length === 0) {
			return 'At least one employment type must be selected';
		}
		return '';
	});

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

		return result;
	});

	let totalPolicies = $derived(data.policies.length);
	let activePoliciesCount = $derived(data.policies.filter((p) => p.status).length);
</script>

<svelte:head>
	<title>Leave Policies | HRMS</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
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
			<Button onclick={openAddModal}>Add Leave Policy</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardDescription>Total Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalPolicies}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Active Policies</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{activePoliciesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<!-- Search bar -->
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

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Leave Type</TableHead>
						<TableHead>Employment Types</TableHead>
						<TableHead class="w-24 text-right">Quota (Annual)</TableHead>
						<TableHead class="w-24 text-center">Carry Fwd</TableHead>
						<TableHead class="w-24 text-center">Half Day</TableHead>
						<TableHead class="w-24 text-center">Gender</TableHead>
						<TableHead class="w-24 text-center">Status</TableHead>
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
						{#each filteredPolicies as policy (policy.cuid)}
							<TableRow>
								<TableCell class="font-semibold">{getLeaveTypeName(policy.leave_type_cuid)}</TableCell>
								<TableCell class="text-xs">{getEmploymentTypeNames(policy.employment_type_cuids)}</TableCell>
								<TableCell class="text-right font-mono font-semibold">{policy.annual_quota}</TableCell>
								<TableCell class="text-center text-xs">
									{#if policy.carry_forward_allowed}
										<Badge class="bg-green-500 text-white border-0">Yes ({policy.max_carry_forward_days})</Badge>
									{:else}
										<Badge variant="secondary">No</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-center text-xs">
									{#if policy.allow_half_day}
										<Badge class="bg-blue-500 text-white border-0">Allowed</Badge>
									{:else}
										<Badge variant="secondary">No</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-center text-xs">
									{#if policy.gender_specific}
										<Badge class="bg-amber-500 text-white border-0">{policy.applicable_gender}</Badge>
									{:else}
										<Badge variant="secondary">All</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if policy.status}
										<Badge class="bg-green-500 text-white border-0">Active</Badge>
									{:else}
										<Badge variant="secondary">Inactive</Badge>
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
		<p class="text-xs text-muted-foreground">
			Showing {filteredPolicies.length} of {totalPolicies} entries
		</p>
	</div>
</div>

<FormModal
	bind:isOpen={isFormModalOpen}
	title={editUuid ? 'Edit Leave Policy' : 'Add Leave Policy'}
	onsubmit={handleSubmit}
	onCloseRequest={handleCloseRequest}
>
	{#if editUuid}
		<input type="hidden" name="cuid" value={editUuid} />
	{/if}

	<!-- Leave Type Dropdown -->
	<div class="space-y-2">
		<Label for="modal_leave_type_cuid" class={form && 'field' in form && form.field === 'leave_type_cuid' ? 'text-destructive' : ''}>Leave Type <span class="text-destructive">*</span></Label>
		<select
			id="modal_leave_type_cuid"
			name="leave_type_cuid"
			bind:value={leaveTypeId}
			onchange={() => { if (form && form.field === 'leave_type_cuid') form = null; }}
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {form && 'field' in form && form.field === 'leave_type_cuid' ? 'border-destructive' : ''}"
			required
		>
			<option value="">Select Leave Type</option>
			{#each data.leaveTypes.filter((t) => t.status || (editingPolicy && editingPolicy.leave_type_cuid === t.cuid)) as type (type.cuid)}
				<option value={type.cuid}>{type.leave_name}</option>
			{/each}
		</select>
		{#if form && 'field' in form && form.field === 'leave_type_cuid'}
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
						onchange={() => { toggleEmploymentType(empType.cuid); if (form && form.field === 'employment_type_cuids') form = null; }}
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

	<!-- Annual Quota -->
	<div class="space-y-2">
		<Label for="modal_annual_quota" class={(form && 'field' in form && form.field === 'annual_quota') || quotaError ? 'text-destructive' : ''}>Annual Quota (Days) <span class="text-destructive">*</span></Label>
		<Input
			id="modal_annual_quota"
			name="annual_quota"
			bind:value={annualQuota}
			oninput={() => { if (form && form.field === 'annual_quota') form = null; }}
			placeholder="e.g. 12 or 1.5"
			required
			class={(form && 'field' in form && form.field === 'annual_quota') || quotaError ? 'border-destructive' : ''}
		/>
		{#if quotaError}
			<p class="text-xs font-medium text-destructive mt-1">{quotaError}</p>
		{:else if form && 'field' in form && form.field === 'annual_quota'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Max Per Month -->
	<div class="space-y-2">
		<Label for="modal_max_per_month" class={(form && 'field' in form && form.field === 'max_per_month') || maxPerMonthError ? 'text-destructive' : ''}>Max Per Month (Optional)</Label>
		<Input
			id="modal_max_per_month"
			name="max_per_month"
			bind:value={maxPerMonth}
			oninput={() => { if (form && form.field === 'max_per_month') form = null; }}
			placeholder="e.g. 2"
			class={(form && 'field' in form && form.field === 'max_per_month') || maxPerMonthError ? 'border-destructive' : ''}
		/>
		{#if maxPerMonthError}
			<p class="text-xs font-medium text-destructive mt-1">{maxPerMonthError}</p>
		{:else if form && 'field' in form && form.field === 'max_per_month'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Carry Forward Options -->
	<div class="flex items-center space-x-2 pt-2">
		<input type="checkbox" id="modal_carry_forward_allowed" name="carry_forward_allowed" bind:checked={carryForwardAllowed} onchange={() => { if (form && form.field === 'carry_forward_allowed') form = null; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_carry_forward_allowed" class="cursor-pointer select-none">Carry Forward Allowed</Label>
	</div>

	{#if carryForwardAllowed}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_max_carry_forward_days" class={(form && 'field' in form && form.field === 'max_carry_forward_days') || carryForwardDaysError ? 'text-destructive' : ''}>Max Carry Forward Days <span class="text-destructive">*</span></Label>
			<Input
				id="modal_max_carry_forward_days"
				name="max_carry_forward_days"
				bind:value={maxCarryForwardDays}
				oninput={() => { if (form && form.field === 'max_carry_forward_days') form = null; }}
				placeholder="e.g. 5"
				required={carryForwardAllowed}
				class={(form && 'field' in form && form.field === 'max_carry_forward_days') || carryForwardDaysError ? 'border-destructive' : ''}
			/>
			{#if carryForwardDaysError}
				<p class="text-xs font-medium text-destructive mt-1">{carryForwardDaysError}</p>
			{:else if form && 'field' in form && form.field === 'max_carry_forward_days'}
				<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
			{/if}
		</div>
	{/if}

	<!-- Min Service Days -->
	<div class="space-y-2">
		<Label for="modal_min_service_days" class={(form && 'field' in form && form.field === 'min_service_days') || minServiceDaysError ? 'text-destructive' : ''}>Min Service Days (Active service req.) <span class="text-destructive">*</span></Label>
		<Input
			id="modal_min_service_days"
			name="min_service_days"
			bind:value={minServiceDays}
			oninput={() => { if (form && form.field === 'min_service_days') form = null; }}
			placeholder="e.g. 90"
			class={(form && 'field' in form && form.field === 'min_service_days') || minServiceDaysError ? 'border-destructive' : ''}
		/>
		{#if minServiceDaysError}
			<p class="text-xs font-medium text-destructive mt-1">{minServiceDaysError}</p>
		{:else if form && 'field' in form && form.field === 'min_service_days'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Other Checkboxes -->
	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_allow_half_day" name="allow_half_day" bind:checked={allowHalfDay} onchange={() => { if (form && form.field === 'allow_half_day') form = null; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_allow_half_day" class="cursor-pointer select-none">Allow Half Day</Label>
	</div>

	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_requires_document" name="requires_document" bind:checked={requiresDocument} onchange={() => { if (form && form.field === 'requires_document') form = null; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_requires_document" class="cursor-pointer select-none">Requires Document Attachment</Label>
	</div>

	<!-- Gender Specific Rules -->
	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_gender_specific" name="gender_specific" bind:checked={genderSpecific} onchange={() => { if (form && form.field === 'gender_specific') form = null; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_gender_specific" class="cursor-pointer select-none">Gender Specific Leave</Label>
	</div>

	{#if genderSpecific}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_applicable_gender" class={(form && 'field' in form && form.field === 'applicable_gender') || genderError ? 'text-destructive' : ''}>Applicable Gender <span class="text-destructive">*</span></Label>
			<select
				id="modal_applicable_gender"
				name="applicable_gender"
				bind:value={applicableGender}
				onchange={() => { if (form && form.field === 'applicable_gender') form = null; }}
				required={genderSpecific}
				class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {(form && 'field' in form && form.field === 'applicable_gender') || genderError ? 'border-destructive' : ''}"
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

	<!-- Active Status -->
	<!-- Status Dropdown -->
	<div class="space-y-2 pb-2">
		<Label for="modal_status">Status <span class="text-destructive">*</span></Label>
		<select
			id="modal_status"
			name="status"
			bind:value={status}
			onchange={() => { if (form && form.field === 'status') form = null; }}
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none"
			required
		>
			<option value={true}>Active</option>
			<option value={false}>Inactive</option>
		</select>
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



