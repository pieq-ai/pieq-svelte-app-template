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
			toast.error('Please fix the validation errors.');
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
		
		const nameErr = getNameClientError(leaveName);
		const codeErr = getCodeClientError(leaveCode);
		const hasValidationErrors = !!nameErr || !!codeErr;

		if (editCuid) {
			if (!leaveName.trim() || !leaveCode.trim()) return true;
			if (hasValidationErrors) return true;
			return !hasChanges;
		} else {
			if (!leaveName.trim() || !leaveCode.trim()) return true;
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
			submissionAttempted = false;
			errors = {};
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

	let nameClientError = $derived(errors.leave_name || '');
	let codeClientError = $derived(errors.leave_code || '');

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
			const targetStatus = filterStatus === 'active';
			result = result.filter((t) => t.status === targetStatus);
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
</script>

<svelte:head>
	<title>Leave Types | HRMS</title>
</svelte:head>

<div class="w-full space-y-8 px-1 py-4">
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
			<Button onclick={openAddModal}>+ Add Leave Type</Button>
		</div>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardDescription>Total Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-foreground">{totalTypes}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Active Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-emerald-600 dark:text-emerald-500">{activeTypesCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
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
			<div class="relative w-full sm:w-48">
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
								onclick={() => handleSort('leave_name')}
								class="flex items-center gap-1 cursor-pointer select-none group"
							>
								<span>Leave Name</span>
								<span class="text-[10px] transition-colors {sortKey === 'leave_name' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'leave_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-32">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('leave_code')}
								class="flex items-center gap-1 cursor-pointer select-none group"
							>
								<span>Leave Code</span>
								<span class="text-[10px] transition-colors {sortKey === 'leave_code' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'leave_code' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('is_paid')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Paid</span>
								<span class="text-[10px] transition-colors {sortKey === 'is_paid' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'is_paid' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-28 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('requires_approval')}
								class="flex items-center justify-center gap-1 cursor-pointer select-none group"
							>
								<span>Approval Required</span>
								<span class="text-[10px] transition-colors {sortKey === 'requires_approval' ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}">
									{sortKey === 'requires_approval' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
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
					{#if filteredTypes.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground">
								No leave types found.
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedTypes as type (type.cuid)}
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
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-emerald-500"></span>
											Paid
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white/70 border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-neutral-400"></span>
											Unpaid
										</span>
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if type.requires_approval}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-blue-500"></span>
											Yes
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white/70 border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-neutral-400"></span>
											Auto-Approve
										</span>
									{/if}
								</TableCell>
								<TableCell class="text-center">
									{#if type.status}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-emerald-500"></span>
											Active
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1E1E] text-white/70 border border-[#2A2A2A] shadow-xs select-none mx-auto">
											<span class="size-1.5 rounded-full bg-rose-500"></span>
											Inactive
										</span>
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
		
		<Pagination totalItems={filteredTypes.length} bind:currentPage={currentPage} />
	</div>
</div>

<FormModal
	bind:isOpen={isFormModalOpen}
	title={editCuid ? 'Edit Leave Type' : 'Add Leave Type'}
	onsubmit={handleSubmit}
	onCloseRequest={handleCloseRequest}
	disableEscape={isDiscardModalOpen}
>
	{#if editCuid}
		<input type="hidden" name="cuid" value={editCuid} />
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div class="space-y-2">
			<Label for="modal_leave_name" class={(form && 'field' in form && form.field === 'leave_name') || nameClientError ? 'text-destructive' : ''}>Leave Name <span class="text-destructive">*</span></Label>
			<Input
				id="modal_leave_name"
				name="leave_name"
				bind:value={leaveName}
				oninput={() => {
					if (form && form.field === 'leave_name') form = null;
					const err = getNameClientError(leaveName);
					if (!err) {
						errors.leave_name = '';
					} else if (submissionAttempted || errors.leave_name) {
						errors.leave_name = err;
					}
				}}
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
			<Label for="modal_leave_code" class={(form && 'field' in form && form.field === 'leave_code') || codeClientError ? 'text-destructive' : ''}>Leave Code <span class="text-destructive">*</span></Label>
			<Input
				id="modal_leave_code"
				name="leave_code"
				bind:value={leaveCode}
				oninput={() => {
					if (form && form.field === 'leave_code') form = null;
					const err = getCodeClientError(leaveCode);
					if (!err) {
						errors.leave_code = '';
					} else if (submissionAttempted || errors.leave_code) {
						errors.leave_code = err;
					}
				}}
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
			class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
	<div class="space-y-2 pb-2">
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
			{editCuid ? 'Update Leave Type' : 'Save Leave Type'}
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


