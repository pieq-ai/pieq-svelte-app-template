<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
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
	} from '$lib/components';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	// Confirm Modal states
	let isConfirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let activeDeleteForm = $state<HTMLFormElement | null>(null);

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

	// Active Edit Mode Detection from URL query parameter
	let editUuid = $derived(page.url.searchParams.get('edit'));
	let editingPolicy = $derived(data.policies.find((p) => p.uuid === editUuid));

	// Form local state
	let leaveTypeId = $state('');
	let selectedEmploymentTypes = $state<number[]>([]);
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

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (form && 'action' in form && form.action === 'update' && 'uuid' in form && form.uuid === editUuid) {
			if ('leave_type_id' in form) leaveTypeId = String(form.leave_type_id);
			if ('employment_type_ids' in form) selectedEmploymentTypes = form.employment_type_ids as number[];
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
			if ('leave_type_id' in form) leaveTypeId = String(form.leave_type_id);
			if ('employment_type_ids' in form) selectedEmploymentTypes = form.employment_type_ids as number[];
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
			leaveTypeId = String(editingPolicy.leave_type_id);
			selectedEmploymentTypes = editingPolicy.employment_type_ids;
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

	// Clear query parameter on modal close
	$effect(() => {
		if (!isFormModalOpen && editUuid) {
			goto(resolve('/leave-policies'), { replaceState: true });
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
		if (!maxCarryForwardDays) return 'Max carry forward days is required when carry forward is allowed';
		const days = Number(maxCarryForwardDays);
		if (isNaN(days) || days < 0) {
			return 'Max carry forward days must be a positive number';
		}
		if (annualQuota) {
			const quota = Number(annualQuota);
			if (!isNaN(quota) && days > quota) {
				return 'Max carry forward days cannot exceed annual quota';
			}
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

	function toggleEmploymentType(id: number) {
		if (selectedEmploymentTypes.includes(id)) {
			selectedEmploymentTypes = selectedEmploymentTypes.filter((x) => x !== id);
		} else {
			selectedEmploymentTypes = [...selectedEmploymentTypes, id];
		}
	}

	function getLeaveTypeName(id: number): string {
		const found = data.leaveTypes.find((t) => t.id === id);
		return found ? found.leave_name : `ID: ${id}`;
	}

	function getEmploymentTypeNames(ids: number[]): string {
		if (ids.length === 0) return 'None';
		return ids
			.map((id) => {
				const found = data.employmentTypes.find((et) => et.id === id);
				return found ? found.employment_name : `ID: ${id}`;
			})
			.join(', ');
	}

	// Derived list
	let filteredPolicies = $derived.by(() => {
		let result = [...data.policies];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((p) => {
				const leaveName = getLeaveTypeName(p.leave_type_id).toLowerCase();
				const empNames = getEmploymentTypeNames(p.employment_type_ids).toLowerCase();
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
						{#each filteredPolicies as policy (policy.uuid)}
							<TableRow class={!policy.status ? 'opacity-60' : ''}>
								<TableCell class="font-semibold">{getLeaveTypeName(policy.leave_type_id)}</TableCell>
								<TableCell class="text-xs">{getEmploymentTypeNames(policy.employment_type_ids)}</TableCell>
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
								<TableCell class="text-right space-x-1">
									<a
										href={resolve(('/leave-policies?edit=' + policy.uuid) as '/leave-policies')}
										class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
										title="Edit Leave Policy"
									>
										<EditIcon class="size-4" />
									</a>

									<form
										method="POST"
										action="?/delete"
										class="inline"
										use:enhance={() => {
											isSubmitting = true;
											return async ({ result, update }) => {
												if (result.type === 'success') {
													const updatedStatus = result.data?.status;
													toast.success(
														updatedStatus === false
															? 'Leave policy deactivated successfully!'
															: 'Leave policy reactivated successfully!'
													);
												} else if (result.type === 'failure') {
													toast.error(String(result.data?.error || 'Action failed'));
												}
												await update();
												isSubmitting = false;
											};
										}}
									>
										<input type="hidden" name="uuid" value={policy.uuid} />
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											class={policy.status ? 'text-destructive hover:text-destructive/80 size-8' : 'text-green-500 hover:text-green-600 size-8'}
											title={policy.status ? 'Deactivate Leave Policy' : 'Reactivate Leave Policy'}
											disabled={isSubmitting}
											onclick={(e) => {
												activeDeleteForm = e.currentTarget.closest('form');
												confirmTitle = policy.status ? 'Deactivate Leave Policy' : 'Reactivate Leave Policy';
												confirmMessage = policy.status
													? 'Are you sure you want to deactivate this leave policy?'
													: 'Are you sure you want to reactivate this leave policy?';
												isConfirmOpen = true;
											}}
										>
											{#if policy.status}
												<TrashIcon class="size-4" />
											{:else}
												<RotateCcwIcon class="size-4" />
											{/if}
										</Button>
									</form>
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
	action={editUuid ? '?/update' : '?/create'}
	useEnhance={() => {
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				toast.success(
					editUuid
						? 'Leave policy updated successfully!'
						: 'Leave policy created successfully!'
				);
				isFormModalOpen = false;
				if (editUuid) {
					await goto(resolve('/leave-policies'), { replaceState: true });
				}
				await update({ reset: true });
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.error || 'Validation failed'));
				await update({ reset: false });
			} else {
				await update();
			}
			isSubmitting = false;
		};
	}}
>
	{#if editUuid}
		<input type="hidden" name="uuid" value={editUuid} />
	{/if}

	<!-- Leave Type Dropdown -->
	<div class="space-y-2">
		<Label for="modal_leave_type_id" class={form && 'field' in form && form.field === 'leave_type_id' ? 'text-destructive' : ''}>Leave Type</Label>
		<select
			id="modal_leave_type_id"
			name="leave_type_id"
			bind:value={leaveTypeId}
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none {form && 'field' in form && form.field === 'leave_type_id' ? 'border-destructive' : ''}"
			required
		>
			<option value="">Select Leave Type</option>
			{#each data.leaveTypes.filter((t) => t.status || (editingPolicy && editingPolicy.leave_type_id === t.id)) as type (type.id)}
				<option value={type.id}>{type.leave_name}</option>
			{/each}
		</select>
		{#if form && 'field' in form && form.field === 'leave_type_id'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Employment Types -->
	<div class="space-y-2">
		<Label class={(form && 'field' in form && form.field === 'employment_type_ids') || employmentTypesError ? 'text-destructive' : ''}>Applicable Employment Types</Label>
		<div class="border rounded-md p-3 space-y-2 max-h-36 overflow-y-auto bg-transparent">
			{#each data.employmentTypes.filter((et) => et.status || (editingPolicy && editingPolicy.employment_type_ids.includes(et.id))) as empType (empType.id)}
				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						name="employment_type_ids"
						value={empType.id}
						checked={selectedEmploymentTypes.includes(empType.id)}
						onchange={() => toggleEmploymentType(empType.id)}
						class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
					/>
					<Label class="cursor-pointer select-none font-normal text-xs">{empType.employment_name}</Label>
				</div>
			{/each}
		</div>
		{#if employmentTypesError}
			<p class="text-xs font-medium text-destructive mt-1">{employmentTypesError}</p>
		{:else if form && 'field' in form && form.field === 'employment_type_ids'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<!-- Annual Quota -->
	<div class="space-y-2">
		<Label for="modal_annual_quota" class={(form && 'field' in form && form.field === 'annual_quota') || quotaError ? 'text-destructive' : ''}>Annual Quota (Days)</Label>
		<Input
			id="modal_annual_quota"
			name="annual_quota"
			bind:value={annualQuota}
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
		<input type="checkbox" id="modal_carry_forward_allowed" name="carry_forward_allowed" bind:checked={carryForwardAllowed} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_carry_forward_allowed" class="cursor-pointer select-none">Carry Forward Allowed</Label>
	</div>

	{#if carryForwardAllowed}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_max_carry_forward_days" class={(form && 'field' in form && form.field === 'max_carry_forward_days') || carryForwardDaysError ? 'text-destructive' : ''}>Max Carry Forward Days</Label>
			<Input
				id="modal_max_carry_forward_days"
				name="max_carry_forward_days"
				bind:value={maxCarryForwardDays}
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
		<Label for="modal_min_service_days" class={(form && 'field' in form && form.field === 'min_service_days') || minServiceDaysError ? 'text-destructive' : ''}>Min Service Days (Active service req.)</Label>
		<Input
			id="modal_min_service_days"
			name="min_service_days"
			bind:value={minServiceDays}
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
		<input type="checkbox" id="modal_allow_half_day" name="allow_half_day" bind:checked={allowHalfDay} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_allow_half_day" class="cursor-pointer select-none">Allow Half Day</Label>
	</div>

	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_requires_document" name="requires_document" bind:checked={requiresDocument} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_requires_document" class="cursor-pointer select-none">Requires Document Attachment</Label>
	</div>

	<!-- Gender Specific Rules -->
	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_gender_specific" name="gender_specific" bind:checked={genderSpecific} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_gender_specific" class="cursor-pointer select-none">Gender Specific Leave</Label>
	</div>

	{#if genderSpecific}
		<div transition:slide class="space-y-2 pl-4">
			<Label for="modal_applicable_gender" class={(form && 'field' in form && form.field === 'applicable_gender') || genderError ? 'text-destructive' : ''}>Applicable Gender</Label>
			<select
				id="modal_applicable_gender"
				name="applicable_gender"
				bind:value={applicableGender}
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
	{#if editUuid}
		<div class="flex items-center space-x-2 pb-2">
			<input type="checkbox" id="modal_status" name="status" bind:checked={status} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
			<Label for="modal_status" class="cursor-pointer select-none">Active Status</Label>
		</div>
	{/if}

	<!-- Alert Errors -->
	{#if formError && (!form || !('field' in form) || !form.field)}
		<div transition:slide>
			<Alert variant="destructive">
				<AlertDescription>{formError}</AlertDescription>
			</Alert>
		</div>
	{/if}

	<Button type="submit" class="w-full" disabled={isSubmitting || !!quotaError || !!maxPerMonthError || !!carryForwardDaysError || !!minServiceDaysError || !!genderError || !!employmentTypesError}>
		{#if isSubmitting}
			<LoaderCircleIcon class="size-4 animate-spin" />
			Saving...
		{:else}
			{editUuid ? 'Update Leave Policy' : 'Save Leave Policy'}
		{/if}
	</Button>
</FormModal>

<ConfirmModal
	bind:isOpen={isConfirmOpen}
	title={confirmTitle}
	message={confirmMessage}
	onConfirm={() => {
		activeDeleteForm?.requestSubmit();
	}}
/>

