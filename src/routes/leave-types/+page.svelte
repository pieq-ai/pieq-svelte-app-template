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
		Pagination,
		Dropdown
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
			const url = editCuid ? `/api/leave/types/leaveTypeCuid=${editCuid}` : '/api/leave/types';
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

	const filterStatusOptions = [
		{ value: 'all', label: 'All Statuses' },
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' }
	];

	const statusOptions = [
		{ value: true, label: 'Active' },
		{ value: false, label: 'Inactive' }
	];

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
			errors = {};
			touched = {};
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
			touched = {};
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
	let touched = $state<Record<string, boolean>>({});
	let submissionAttempted = $state(false);

	function getFieldError(
		value: string,
		getErr: (val: string) => string,
		isTouched: boolean,
		submitAttempted: boolean,
		backendErr?: string
	): string {
		if (backendErr) return backendErr;
		const clientErr = getErr(value);
		if (!clientErr) return '';
		if (value && value.trim() !== '') {
			return clientErr;
		}
		if (isTouched || submitAttempted) {
			return clientErr;
		}
		return '';
	}

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

	let nameClientError = $derived(getFieldError(leaveName, getNameClientError, touched.leave_name, submissionAttempted, errors.leave_name));
	let codeClientError = $derived(getFieldError(leaveCode, getCodeClientError, touched.leave_code, submissionAttempted, errors.leave_code));

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
	let inactiveTypesCount = $derived(data.leaveTypes.filter((t) => !t.status).length);
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
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Total Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#262626] dark:text-neutral-200">{totalTypes}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Active Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#F45310]">{activeTypesCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription class="text-black dark:text-white">Inactive Leave Types</CardDescription>
				<CardTitle class="text-4xl tabular-nums font-bold text-[#800020] dark:text-[#b83d58]">{inactiveTypesCount}</CardTitle>
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
			<div class="w-full sm:w-48">
				<Dropdown
					bind:value={filterStatus}
					options={filterStatusOptions}
					isFilter={true}
				/>
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
								class="flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Leave Name</span>
								<span class="text-sm transition-colors {sortKey === 'leave_name' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'leave_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-32">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('leave_code')}
								class="flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Leave Code</span>
								<span class="text-sm transition-colors {sortKey === 'leave_code' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'leave_code' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('is_paid')}
								class="flex items-center justify-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Paid</span>
								<span class="text-sm transition-colors {sortKey === 'is_paid' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'is_paid' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-28 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('requires_approval')}
								class="flex items-center justify-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Approval Required</span>
								<span class="text-sm transition-colors {sortKey === 'requires_approval' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
									{sortKey === 'requires_approval' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
								</span>
							</div>
						</TableHead>
						<TableHead class="w-24 text-center">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => handleSort('status')}
								class="flex items-center justify-center gap-1.5 cursor-pointer select-none group"
							>
								<span>Status</span>
								<span class="text-sm transition-colors {sortKey === 'status' ? 'text-black dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500 font-normal group-hover:text-black dark:group-hover:text-white'}">
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
									{#if type.status}
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

	<div class="space-y-2">
		<Label for="modal_leave_name" class={(form && 'field' in form && form.field === 'leave_name') || nameClientError ? 'text-destructive' : ''}>Leave Name <span class="text-destructive">*</span></Label>
		<Input
			id="modal_leave_name"
			name="leave_name"
			bind:value={leaveName}
			oninput={() => {
				if (form && form.field === 'leave_name') form = null;
				errors.leave_name = '';
				touched.leave_name = true;
			}}
			onblur={() => touched.leave_name = true}
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
				errors.leave_code = '';
				touched.leave_code = true;
			}}
			onblur={() => touched.leave_code = true}
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
		<Label for="modal_status" class={form && 'field' in form && form.field === 'status' ? 'text-destructive' : ''}>Status <span class="text-destructive">*</span></Label>
		<Dropdown
			id="modal_status"
			name="status"
			bind:value={status}
			options={statusOptions}
			required={true}
			onchange={() => {
				if (form && form.field === 'status') form = null;
				errors.status = '';
				touched.status = true;
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


