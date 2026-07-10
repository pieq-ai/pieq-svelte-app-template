<script lang="ts">
	import { slide } from 'svelte/transition';
	import { goto, invalidate, beforeNavigate } from '$app/navigation';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	
	import {
		Alert,
		AlertDescription,
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
		toast
	} from '$lib/components/ui';
	import { ConfirmModal, CrudModal, Pagination, TableActions, FilterDropdown, StatusDropdown, StatusBadge, SearchInput, Checkbox } from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let form = $state<{ error?: string; field?: string; action?: string } | null>(null);

	let currentPage = $state(1);
	let searchQuery = $state('');
	let isSubmitting = $state(false);
	let isFormModalOpen = $state(false);

	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);
	let filterStatus = $state<'all' | boolean>('all');

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
		editCuid = null;
		leaveName = '';
		leaveCode = '';
		description = '';
		isPaid = true;
		requiresApproval = true;
		status = true;
		isFormModalOpen = true;
	}

	function openEditModal(cuid: string) {
		editCuid = cuid;
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		validationState.markAttempted();

		// Rebuild validation error state from scratch on Save
		errors = {};

		// Validate all fields client-side simultaneously
		const nameErr = getNameClientError(leaveName);
		const codeErr = getCodeClientError(leaveCode);

		errors.name = nameErr;
		errors.code = codeErr;

		if (nameErr || codeErr) {
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			name: leaveName,
			code: leaveCode,
			description: description || null,
			is_paid: isPaid,
			requires_approval: requiresApproval,
			status: status
		};

		try {
			const url = editCuid ? `/api/leave/types/${editCuid}` : '/api/leave/types';
			const res = await fetch(url, {
				method: editCuid ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json();

			if (res.ok && result.data) {
				toast.success(result.data.message);
				isFormModalOpen = false;
				await invalidate('/api/leave/types');
			} else {
				if (result.data?.error && typeof result.data.error === 'object') {
					errors = { ...result.data.error };
					if (result.data.error.general) {
						form = {
							error: result.data.error.general,
							field: undefined,
							action: editCuid ? 'update' : 'create'
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
							action: editCuid ? 'update' : 'create'
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
						action: editCuid ? 'update' : 'create'
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



	// Active Edit Mode Detection (local state – no longer URL-driven)
	let editCuid = $state<string | null>(null);
	let editingType = $derived(data.leaveTypes.find((t) => t.cuid === editCuid));

	// Form local state
	let leaveName = $state('');
	let leaveCode = $state('');
	let description = $state('');
	let isPaid = $state(true);
	let requiresApproval = $state(true);
	let status = $state(true);

	let hasChanges = $derived.by(() => {
		if (!editCuid || !editingType) return false;
		return (
			leaveName.trim() !== editingType.name.trim() ||
			leaveCode.trim() !== editingType.code.trim() ||
			description.trim() !== (editingType.description || '').trim() ||
			isPaid !== editingType.is_paid ||
			requiresApproval !== editingType.requires_approval ||
			status !== editingType.status
		);
	});

	let hasUnsavedChanges = $derived.by(() => {
		if (editCuid) {
			return hasChanges;
		} else {
			return (
				leaveName.trim() !== '' ||
				leaveCode.trim() !== '' ||
				description.trim() !== '' ||
				isPaid !== true ||
				requiresApproval !== true ||
				status !== true
			);
		}
	});

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		const mandatoryFieldsFilled = leaveName.trim() !== '' && leaveCode.trim() !== '';
		if (!mandatoryFieldsFilled) return true;
		if (editCuid) {
			return !hasChanges;
		}
		return false;
	});



	let hasSynchronized = $state(false);

	$effect(() => {
		if (isFormModalOpen) {
			hasSynchronized = false;
			errors = {};
			validationState.reset();
		}
	});

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (!isFormModalOpen) return;
		if (hasSynchronized) return;

		if (editingType) {
			leaveName = editingType.name;
			leaveCode = editingType.code;
			description = editingType.description || '';
			isPaid = editingType.is_paid;
			requiresApproval = editingType.requires_approval;
			status = editingType.status;
			hasSynchronized = true;
		} else if (!editCuid) {
			leaveName = '';
			leaveCode = '';
			description = '';
			isPaid = true;
			requiresApproval = true;
			status = true;
			hasSynchronized = true;
		}
	});

	// Reset form state on modal close
	$effect(() => {
		if (!isFormModalOpen) {
			form = null;
			isSubmitting = false;
			leaveName = '';
			leaveCode = '';
			description = '';
			isPaid = true;
			requiresApproval = true;
			status = true;
			errors = {};
			validationState.reset();
			hasSynchronized = false;
			editCuid = null;
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	let errors = $state<Record<string, string>>({});
	
	import { createValidationState } from '$lib/utils';
	const validationState = createValidationState();

	function getNameClientError(name: string): string {
		if (!name || name.trim() === '') {
			return 'Leave name is required';
		}
		const trimmed = name.trim();
		if (trimmed.length <= 5) {
			return 'Leave name must be more than 5 characters long';
		}
		if (trimmed.length > 100) {
			return 'Leave name must be 100 characters or fewer';
		}
		const REGEX = /^[a-zA-Z\s]+$/;
		if (!REGEX.test(trimmed)) {
			return 'Leave name can only contain letters and spaces';
		}
		return '';
	}

	function getCodeClientError(code: string): string {
		if (!code || code.trim() === '') {
			return 'Leave code is required';
		}
		const trimmed = code.trim().toUpperCase();
		if (trimmed.length > 20) {
			return 'Leave code must be 20 characters or fewer';
		}
		const CODE_REGEX = /^[A-Z_]+$/;
		if (!CODE_REGEX.test(trimmed)) {
			return 'Leave code can only contain uppercase letters and underscores';
		}
		return '';
	}

	let nameValidationError = $derived(getNameClientError(leaveName));
	let codeValidationError = $derived(getCodeClientError(leaveCode));

	// Derived list
	let filteredTypes = $derived.by(() => {
		let result = [...data.leaveTypes];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.name.toLowerCase().includes(query) ||
					t.code.toLowerCase().includes(query) ||
					(t.description && t.description.toLowerCase().includes(query))
			);
		}

		if (filterStatus !== 'all') {
			result = result.filter((t) => t.status === filterStatus);
		}

		// Sort behavior
		if (sortKey && sortDirection) {
			result.sort((a, b) => {
				const valA = a[sortKey as keyof typeof a];
				const valB = b[sortKey as keyof typeof b];

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

				return 0;
			});
		}

		return result;
	});

	let paginatedTypes = $derived(filteredTypes.slice((currentPage - 1) * 10, currentPage * 10));

	$effect(() => {
		// Reset to page 1 when search or filter criteria change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		searchQuery;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filterStatus;
		currentPage = 1;
	});

	let totalTypes = $derived(data.leaveTypes.length);
	let activeTypesCount = $derived(data.leaveTypes.filter((t) => t.status).length);
	let inactiveTypesCount = $derived(data.leaveTypes.filter((t) => !t.status).length);


</script>

<svelte:head>
	<title>Leave Types</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Leave Types</h1>
		</div>
		<Button
			type="button"
			class="bg-hrms-primary text-white hover:bg-hrms-primary/90 border-0"
			onclick={openAddModal}
		>
			Add Leave Type
		</Button>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Total Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-hrms-secondary dark:text-neutral-200">{totalTypes}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Active Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-hrms-primary">{activeTypesCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Inactive Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-hrms-destructive dark:text-[#b83d58]">{inactiveTypesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_leave_types" name="search_leave_types" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by leave name or code..." />
			<FilterDropdown value={filterStatus} onChange={(value) => { filterStatus = value; currentPage = 1; }} allLabel="All Status" triggerClass="w-full sm:w-48" />
		</div>

		<!-- Table Card -->
		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('name')}>
								Leave Name
							{#if sortKey === 'name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-32 font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('code')}>
								Leave Code
							{#if sortKey === 'code' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'code' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('is_paid')}>
								Paid
							{#if sortKey === 'is_paid' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'is_paid' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-28 text-center font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('requires_approval')}>
								Approval Required
							{#if sortKey === 'requires_approval' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'requires_approval' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('status')}>
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
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredTypes.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedTypes as type (type.cuid)}
							<TableRow 
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									openEditModal(type.cuid);
								}} 
								class="cursor-pointer"
							>
								<TableCell class="font-normal">
									<div>{type.name}</div>
									{#if type.description}
										<span class="font-normal text-muted-foreground line-clamp-1">{type.description}</span>
									{/if}
								</TableCell>
								<TableCell class="font-normal uppercase">{type.code}</TableCell>
								<TableCell class="text-center">
									{#if type.is_paid}
										Paid
									{:else}
										Unpaid
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if type.requires_approval}
										Yes
									{:else}
										Auto-Approve
									{/if}
								</TableCell>
								<TableCell class="text-center">
									<StatusBadge status={type.status} />
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										onEdit={() => openEditModal(type.cuid)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		
		<Pagination totalItems={filteredTypes.length} bind:currentPage={currentPage} pageSize={10} />
	</div>
</div>

<CrudModal
	open={isFormModalOpen}
	title={editCuid ? 'Edit Leave Type' : 'Create Leave Type'}
	hasUnsavedChanges={hasUnsavedChanges}
	onClose={() => (isFormModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="space-y-4" novalidate>
			{#if editCuid}
				<input type="hidden" name="cuid" value={editCuid} />
			{/if}

			<div class="space-y-2">
				<Label for="modal_leave_name" class={validationState.shouldShowError('name', nameValidationError) ? 'text-destructive font-medium' : ''}>Leave Name <span class="text-destructive">*</span></Label>
				<Input
					id="modal_leave_name"
					name="name"
					bind:value={leaveName}
					onblur={() => validationState.markTouched('name')}
					oninput={() => {
						if (form && form.field === 'name') form = null;
						errors.name = '';
					}}
					placeholder="e.g. Sick Leave"
					required
					minlength={6}
					pattern="^[a-zA-Z\s]+$"
					error={validationState.shouldShowError('name', nameValidationError) ? (nameValidationError || errors.name) : errors.name}
				/>
			</div>

			<div class="space-y-2">
				<Label for="modal_leave_code" class={validationState.shouldShowError('code', codeValidationError) ? 'text-destructive font-medium' : ''}>Leave Code <span class="text-destructive">*</span></Label>
				<Input
					id="modal_leave_code"
					name="code"
					bind:value={leaveCode}
					onblur={() => validationState.markTouched('code')}
					oninput={() => {
						if (form && form.field === 'code') form = null;
						errors.code = '';
					}}
					placeholder="e.g. SL"
					required
					class="uppercase"
					error={validationState.shouldShowError('code', codeValidationError) ? (codeValidationError || errors.code) : errors.code}
				/>
			</div>

			<div class="space-y-2">
				<Label for="modal_description">Description</Label>
				<textarea
					id="modal_description"
					name="description"
					bind:value={description}
					oninput={() => {
						if (form && form.field === 'description') form = null;
						errors.description = '';
					}}
					placeholder="Optional description of this leave category..."
					rows="3"
					class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>

			<div class="flex items-center gap-2 pt-1">
				<Checkbox id="modal_is_paid" bind:checked={isPaid} onCheckedChange={() => { if (form && form.field === 'is_paid') form = null; errors.is_paid = ''; }} />
				<Label for="modal_is_paid" class="cursor-pointer font-medium">Paid Leave</Label>
			</div>

			<div class="flex items-center gap-2">
				<Checkbox id="modal_requires_approval" bind:checked={requiresApproval} onCheckedChange={() => { if (form && form.field === 'requires_approval') form = null; errors.requires_approval = ''; }} />
				<Label for="modal_requires_approval" class="cursor-pointer font-medium">Requires Approval</Label>
			</div>

			<!-- Status Dropdown -->
			<div class="pb-2">
				<StatusDropdown
					id="modal_status"
					name="status"
					value={status}
					onBlur={() => validationState.markTouched('status')}
					error={validationState.shouldShowError('status', errors.status) ? errors.status : (form && form.field === 'status' ? form.error : '')}
					onChange={(val) => {
						status = val;
						if (form && form.field === 'status') form = null;
						errors.status = '';
					}}
				/>
			</div>

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
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium bg-hrms-primary text-white hover:bg-hrms-primary/90"
					disabled={isSubmitDisabled}
				>
					<!-- force recompile -->
					{#if isSubmitting}
						Saving...
					{:else}
						Save
					{/if}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>


