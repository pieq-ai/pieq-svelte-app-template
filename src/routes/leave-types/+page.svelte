<script lang="ts">
	import { slide } from 'svelte/transition';
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
		toast
	} from '$lib/components/ui';
	import { ConfirmModal, CrudModal, Pagination, TableActions, FilterDropdown, StatusDropdown, StatusBadge } from '$lib/components';
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
		leaveName = '';
		leaveCode = '';
		description = '';
		isPaid = true;
		requiresApproval = true;
		status = true;
		isFormModalOpen = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submissionAttempted = true;

		// Validate all fields client-side simultaneously
		const nameErr = getNameClientError(leaveName);
		const codeErr = getCodeClientError(leaveCode);

		errors.leave_name = nameErr;
		errors.leave_code = codeErr;

		if (nameErr || codeErr) {
			return;
		}

		isSubmitting = true;
		errors.general = '';

		const body = {
			leave_name: leaveName,
			leave_code: leaveCode,
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
				if (editCuid) {
					await goto(resolve('/leave-types'), { replaceState: true });
				} else {
					leaveName = '';
					leaveCode = '';
					description = '';
					isPaid = true;
					requiresApproval = true;
					status = true;
				}
				await invalidateAll();
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
		} catch (error) {
			console.error('Submit failed:', error);
			toast.error('An unexpected error occurred.');
		} finally {
			isSubmitting = false;
		}
	}



	// Active Edit Mode Detection from URL query parameter
	let editCuid = $derived(page.url.searchParams.get('edit'));
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
			leaveName !== editingType.leave_name ||
			leaveCode !== editingType.leave_code ||
			description !== (editingType.description || '') ||
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
				leaveName !== '' ||
				leaveCode !== '' ||
				description !== '' ||
				isPaid !== true ||
				requiresApproval !== true ||
				status !== true
			);
		}
	});

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;

		if (editCuid) {
			if (!leaveName.trim() || !leaveCode.trim()) return true;
			return !hasChanges;
		} else {
			return !leaveName.trim() || !leaveCode.trim();
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
		
		leaveName = '';
		leaveCode = '';
		description = '';
		isPaid = true;
		requiresApproval = true;
		status = true;
		isFormModalOpen = false;
		
		if (pendingNavigation) {
			const target = pendingNavigation.to?.url;
			pendingNavigation = null;
			if (target) {
				await goto(resolve((target.pathname + target.search) as '/leave-types'));
			}
		} else if (editCuid) {
			await goto(resolve('/leave-types'), { replaceState: true });
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

		if (editingType) {
			leaveName = editingType.leave_name;
			leaveCode = editingType.leave_code;
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

	// Sync isFormModalOpen with editCuid
	$effect(() => {
		if (editCuid) {
			isFormModalOpen = true;
		}
	});

	// Reset form state and clear query parameter on modal close
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
			submissionAttempted = false;
			hasSynchronized = false;
			isDiscardModalOpen = false;
			if (editCuid) {
				goto(resolve('/leave-types'), { replaceState: true });
			}
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	let errors = $state<Record<string, string>>({});
	let submissionAttempted = $state(false);

	function getNameClientError(name: string): string {
		if (!name || name.trim() === '') {
			return 'Leave name is required.';
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
			return 'Leave code is required.';
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

	// Derived list
	let filteredTypes = $derived.by(() => {
		let result = [...data.leaveTypes];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.leave_name.toLowerCase().includes(query) ||
					t.leave_code.toLowerCase().includes(query) ||
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
		} else {
			result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
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
		goto(resolve(('/leave-types?edit=' + cuid) as '/leave-types'));
	}
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
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={openAddModal}
		>
			<PlusIcon class="size-4" />
			Add Leave Type
		</Button>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Total Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#262626] dark:text-neutral-200">{totalTypes}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Active Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#F45310]">{activeTypesCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription class="text-black dark:text-white">Inactive Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#800020] dark:text-[#b83d58]">{inactiveTypesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<!-- Search & Filter controls -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by leave name or code..."
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
			<FilterDropdown value={filterStatus} onChange={(value) => { filterStatus = value; currentPage = 1; }} />
		</div>

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('leave_name')}>
								Leave Name
							{#if sortKey === 'leave_name' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'leave_name' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-32">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => handleSort('leave_code')}>
								Leave Code
							{#if sortKey === 'leave_code' && sortDirection === 'asc'}
								<ArrowUpIcon class="ml-2 size-4" />
							{:else if sortKey === 'leave_code' && sortDirection === 'desc'}
								<ArrowDownIcon class="ml-2 size-4" />
							{:else}
								<ArrowUpDownIcon class="ml-2 size-4" />
							{/if}
							</Button>
						</TableHead>
						<TableHead class="w-24 text-center">
							<Button variant="ghost" size="sm" class="h-8" onclick={() => handleSort('is_paid')}>
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
						<TableHead class="w-28 text-center">
							<Button variant="ghost" size="sm" class="h-8" onclick={() => handleSort('requires_approval')}>
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
						<TableHead class="w-24 text-center">
							<Button variant="ghost" size="sm" class="h-8" onclick={() => handleSort('status')}>
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
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredTypes.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground">
								No records found
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedTypes as type (type.cuid)}
							<TableRow onclick={(e) => handleRowClick(type.cuid, e)} class="cursor-pointer">
								<TableCell class="font-normal">
									<div>{type.leave_name}</div>
									{#if type.description}
										<span class="font-normal text-muted-foreground line-clamp-1">{type.description}</span>
									{/if}
								</TableCell>
								<TableCell class="font-normal uppercase">{type.leave_code}</TableCell>
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
										onEdit={() => goto(resolve(('/leave-types?edit=' + type.cuid) as '/leave-types'))}
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
	title={editCuid ? 'Edit Leave Type' : 'Add Leave Type'}
	isDirty={hasUnsavedChanges}
	onClose={confirmDiscard}
>
	{#snippet children({ cancel })}
		<form method="POST" action="" onsubmit={handleSubmit} class="flex flex-col min-h-0 flex-1 overflow-hidden" novalidate>
			{#if editCuid}
				<input type="hidden" name="cuid" value={editCuid} />
			{/if}

			<div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
				<div class="space-y-2">
					<Label for="modal_leave_name" class={errors.leave_name ? 'text-danger' : ''}>Leave Name <span class="text-destructive">*</span></Label>
					<Input
						id="modal_leave_name"
						name="leave_name"
						bind:value={leaveName}
						oninput={() => {
							if (form && form.field === 'leave_name') form = null;
							errors.leave_name = '';
						}}
						placeholder="e.g. Sick Leave"
						required
						minlength={6}
						pattern="^[a-zA-Z\s]+$"
						class={errors.leave_name ? 'border-danger focus-visible:ring-danger/30' : ''}
					/>
					{#if errors.leave_name}
						<p class="text-xs font-medium text-danger mt-1">{errors.leave_name}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="modal_leave_code" class={errors.leave_code ? 'text-danger' : ''}>Leave Code <span class="text-destructive">*</span></Label>
					<Input
						id="modal_leave_code"
						name="leave_code"
						bind:value={leaveCode}
						oninput={() => {
							if (form && form.field === 'leave_code') form = null;
							errors.leave_code = '';
						}}
						placeholder="e.g. SL"
						required
						class="uppercase {errors.leave_code ? 'border-danger focus-visible:ring-danger/30' : ''}"
					/>
					{#if errors.leave_code}
						<p class="text-xs font-medium text-danger mt-1">{errors.leave_code}</p>
					{/if}
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
						class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-input-focus-ring focus-visible:border-input-focus disabled:cursor-not-allowed disabled:opacity-50"
					></textarea>
				</div>

				<div class="flex items-center space-x-2 pt-1">
					<input type="checkbox" id="modal_is_paid" name="is_paid" bind:checked={isPaid} onchange={() => { if (form && form.field === 'is_paid') form = null; errors.is_paid = ''; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
					<Label for="modal_is_paid" class="cursor-pointer select-none">Paid Leave</Label>
				</div>

				<div class="flex items-center space-x-2">
					<input type="checkbox" id="modal_requires_approval" name="requires_approval" bind:checked={requiresApproval} onchange={() => { if (form && form.field === 'requires_approval') form = null; errors.requires_approval = ''; }} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
					<Label for="modal_requires_approval" class="cursor-pointer select-none">Requires Approval</Label>
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
					{#if form && 'field' in form && form.field === 'status'}
						<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
					{/if}
				</div>

				{#if formError && (!form || !('field' in form) || !form.field)}
					<div transition:slide>
						<Alert variant="destructive">
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
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
					class="flex-1 sm:flex-initial sm:min-w-28 font-medium"
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


