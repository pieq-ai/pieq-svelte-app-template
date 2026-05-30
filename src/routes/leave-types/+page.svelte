<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll } from '$app/navigation';
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
		FormModal
	} from '$lib/components';
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
		isSubmitting = true;
		form = null;

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

			if (res.ok && result.success) {
				toast.success(
					editCuid
						? 'Leave type updated successfully!'
						: 'Leave type created successfully!'
				);
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
				form = {
					error: result.message || 'Validation failed',
					field: result.field,
					action: editCuid ? 'update' : 'create'
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
	let editCuid = $derived(page.url.searchParams.get('edit'));
	let editingType = $derived(data.leaveTypes.find((t) => t.cuid === editCuid));

	// Form local state
	let leaveName = $state('');
	let leaveCode = $state('');
	let description = $state('');
	let isPaid = $state(true);
	let requiresApproval = $state(true);
	let status = $state(true);

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (form && 'action' in form && form.action === 'update' && 'cuid' in form && form.cuid === editCuid) {
			if ('leave_name' in form) leaveName = String(form.leave_name);
			if ('leave_code' in form) leaveCode = String(form.leave_code);
			if ('description' in form) description = String(form.description);
			if ('is_paid' in form) isPaid = Boolean(form.is_paid);
			if ('requires_approval' in form) requiresApproval = Boolean(form.requires_approval);
			if ('status' in form) status = Boolean(form.status);
		} else if (form && 'action' in form && form.action === 'create' && !editCuid) {
			if ('leave_name' in form) leaveName = String(form.leave_name);
			if ('leave_code' in form) leaveCode = String(form.leave_code);
			if ('description' in form) description = String(form.description);
			if ('is_paid' in form) isPaid = Boolean(form.is_paid);
			if ('requires_approval' in form) requiresApproval = Boolean(form.requires_approval);
			if ('status' in form) status = Boolean(form.status);
		} else if (editingType) {
			leaveName = editingType.leave_name;
			leaveCode = editingType.leave_code;
			description = editingType.description || '';
			isPaid = editingType.is_paid;
			requiresApproval = editingType.requires_approval;
			status = editingType.status;
		} else {
			leaveName = '';
			leaveCode = '';
			description = '';
			isPaid = true;
			requiresApproval = true;
			status = true;
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
			if (editCuid) {
				goto(resolve('/leave-types'), { replaceState: true });
			}
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	// Client-side validations
	let nameClientError = $derived.by(() => {
		if (!leaveName) return '';
		const trimmed = leaveName.trim();
		if (trimmed.length === 0) return '';
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
	});

	let codeClientError = $derived.by(() => {
		if (!leaveCode) return '';
		const trimmed = leaveCode.trim().toUpperCase();
		if (trimmed.length === 0) return '';
		if (trimmed.length > 20) {
			return 'Leave code must be 20 characters or fewer';
		}
		const CODE_REGEX = /^[A-Z_]+$/;
		if (!CODE_REGEX.test(trimmed)) {
			return 'Leave code can only contain uppercase letters and underscores';
		}
		return '';
	});

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

		return result;
	});

	let totalTypes = $derived(data.leaveTypes.length);
	let activeTypesCount = $derived(data.leaveTypes.filter((t) => t.status).length);
</script>

<svelte:head>
	<title>Leave Types | HRMS</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Leave Type Master</h1>
			<p class="text-muted-foreground">
				Configure types of leave available to employees within the system.
			</p>
		</div>
		<div class="shrink-0">
			<Button onclick={openAddModal}>Add Leave Type</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardDescription>Total Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalTypes}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Active Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{activeTypesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<!-- Search bar -->
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

		<!-- Table Card -->
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Leave Name</TableHead>
						<TableHead class="w-32">Leave Code</TableHead>
						<TableHead class="w-24 text-center">Paid</TableHead>
						<TableHead class="w-28 text-center">Approval Required</TableHead>
						<TableHead class="w-24 text-center">Status</TableHead>
						<TableHead class="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredTypes.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground">
								No leave types found.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredTypes as type (type.cuid)}
							<TableRow>
								<TableCell class="font-semibold">
									<div>{type.leave_name}</div>
									{#if type.description}
										<span class="text-xs font-normal text-muted-foreground line-clamp-1">{type.description}</span>
									{/if}
								</TableCell>
								<TableCell class="font-mono text-xs font-bold uppercase">{type.leave_code}</TableCell>
								<TableCell class="text-center">
									{#if type.is_paid}
										<Badge class="bg-green-500 text-white border-0">Paid</Badge>
									{:else}
										<Badge variant="secondary">Unpaid</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if type.requires_approval}
										<Badge class="bg-blue-500 text-white border-0">Yes</Badge>
									{:else}
										<Badge variant="secondary">Auto-Approve</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if type.status}
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
										onclick={(e) => toggleMenu(type.cuid, e)}
									>
										<EllipsisVerticalIcon class="size-4" />
									</Button>
									{#if activeMenuCuid === type.cuid}
										<div
											style="position: fixed; top: {menuPosition.top}px; left: {menuPosition.left}px;"
											class="z-50 w-28 rounded-md border bg-popover text-popover-foreground shadow-md outline-none text-left"
										>
											<div class="py-1">
												<a
													href={resolve(('/leave-types?edit=' + type.cuid) as '/leave-types')}
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
			Showing {filteredTypes.length} of {totalTypes} entries
		</p>
	</div>
</div>

<FormModal
	bind:isOpen={isFormModalOpen}
	title={editCuid ? 'Edit Leave Type' : 'Add Leave Type'}
	onsubmit={handleSubmit}
>
	{#if editCuid}
		<input type="hidden" name="cuid" value={editCuid} />
	{/if}

	<div class="space-y-2">
		<Label for="modal_leave_name" class={(form && 'field' in form && form.field === 'leave_name') || nameClientError ? 'text-destructive' : ''}>Leave Name</Label>
		<Input
			id="modal_leave_name"
			name="leave_name"
			bind:value={leaveName}
			placeholder="e.g. Sick Leave"
			required
			minlength={6}
			pattern="^[a-zA-Z\s]+$"
			class={(form && 'field' in form && form.field === 'leave_name') || nameClientError ? 'border-destructive focus-visible:ring-destructive' : ''}
		/>
		{#if nameClientError}
			<p class="text-xs font-medium text-destructive mt-1">{nameClientError}</p>
		{:else if form && 'field' in form && form.field === 'leave_name'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_leave_code" class={(form && 'field' in form && form.field === 'leave_code') || codeClientError ? 'text-destructive' : ''}>Leave Code</Label>
		<Input
			id="modal_leave_code"
			name="leave_code"
			bind:value={leaveCode}
			placeholder="e.g. SL"
			required
			class="uppercase {(form && 'field' in form && form.field === 'leave_code') || codeClientError ? 'border-destructive focus-visible:ring-destructive' : ''}"
		/>
		{#if codeClientError}
			<p class="text-xs font-medium text-destructive mt-1">{codeClientError}</p>
		{:else if form && 'field' in form && form.field === 'leave_code'}
			<p class="text-xs font-medium text-destructive mt-1">{form.error}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="modal_description">Description</Label>
		<textarea
			id="modal_description"
			name="description"
			bind:value={description}
			placeholder="Optional description of this leave category..."
			rows="3"
			class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
		></textarea>
	</div>

	<div class="flex items-center space-x-2 pt-1">
		<input type="checkbox" id="modal_is_paid" name="is_paid" bind:checked={isPaid} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_is_paid" class="cursor-pointer select-none">Paid Leave</Label>
	</div>

	<div class="flex items-center space-x-2">
		<input type="checkbox" id="modal_requires_approval" name="requires_approval" bind:checked={requiresApproval} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
		<Label for="modal_requires_approval" class="cursor-pointer select-none">Requires Approval</Label>
	</div>

	<!-- Status Dropdown -->
	<div class="space-y-2 pb-2">
		<Label for="modal_status">Status</Label>
		<select
			id="modal_status"
			name="status"
			bind:value={status}
			class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm w-full min-w-0 outline-none"
			required
		>
			<option value={true}>Active</option>
			<option value={false}>Inactive</option>
		</select>
	</div>

	{#if formError && (!form || !('field' in form) || !form.field)}
		<div transition:slide>
			<Alert variant="destructive">
				<AlertDescription>{formError}</AlertDescription>
			</Alert>
		</div>
	{/if}

	<Button type="submit" class="w-full" disabled={isSubmitting || !!nameClientError || !!codeClientError}>
		{#if isSubmitting}
			<LoaderCircleIcon class="size-4 animate-spin" />
			Saving...
		{:else}
			{editCuid ? 'Update Leave Type' : 'Save Leave Type'}
		{/if}
	</Button>
</FormModal>


