<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckIcon from '@lucide/svelte/icons/check';
	import BanIcon from '@lucide/svelte/icons/ban';
	import PlusIcon from '@lucide/svelte/icons/plus';

	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CardContent,
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
		TableRow
	} from '$lib/components';

	interface Department {
		dept_id: number;
		uuid: string;
		dept_name: string;
		status: 'active' | 'inactive';
	}

	let departmentsList = $state<Department[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
	let sortColumn = $state('dept_name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Create Form State
	let newDeptName = $state('');
	let isSubmitting = $state(false);
	let formError = $state('');
	let formSuccess = $state('');
	let isNewNameTouched = $state(false);

	// Inline Edit State
	let editingUuid = $state<string | null>(null);
	let editingName = $state('');
	let editingStatus = $state<'active' | 'inactive'>('active');
	let isSavingEdit = $state(false);
	let editError = $state('');
	let isEditNameTouched = $state(false);

	/**
	 * Shared frontend validator function.
	 * Returns clear, user-friendly error messages or empty string if valid.
	 */
	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Department name is required';
		}
		if (trimmed.length < 2) {
			return 'Minimum 2 characters required';
		}
		if (trimmed.length > 100) {
			return 'Maximum 100 characters allowed';
		}
		const regex = /^[A-Za-z\s]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters and spaces are allowed';
		}
		return '';
	}

	// Reactive error states
	let newNameValidationError = $derived(isNewNameTouched ? getValidationError(newDeptName) : '');
	let editNameValidationError = $derived(isEditNameTouched ? getValidationError(editingName) : '');

	let filteredDepartments = $derived.by(() => {
		let result = [...departmentsList];

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(dept) =>
					dept.dept_name.toLowerCase().includes(query) ||
					dept.uuid.toLowerCase().includes(query)
			);
		}

		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter((dept) => dept.status === statusFilter);
		}

		// Sorting
		result.sort((a, b) => {
			const valA = a[sortColumn as keyof typeof a];
			const valB = b[sortColumn as keyof typeof b];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}
			return sortDirection === 'asc'
				? (valA as number) - (valB as number)
				: (valB as number) - (valA as number);
		});

		return result;
	});

	let totalCount = $derived(departmentsList.length);
	let activeCount = $derived(departmentsList.filter((d) => d.status === 'active').length);
	let inactiveCount = $derived(departmentsList.filter((d) => d.status === 'inactive').length);

	async function loadDepartments() {
		isLoading = true;
		loadError = '';
		try {
			const response = await fetch('/api/departments');
			const resData = await response.json();
			if (response.ok) {
				departmentsList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load departments.';
			}
		} catch (err) {
			loadError = 'An error occurred while loading departments.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDepartments();
	});

	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function sortIndicator(column: string) {
		if (sortColumn !== column) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	// Create Department
	async function handleAddDepartment(e: Event) {
		e.preventDefault();
		isNewNameTouched = true;

		const validationError = getValidationError(newDeptName);
		if (validationError) {
			formError = validationError;
			return;
		}

		formError = '';
		formSuccess = '';
		isSubmitting = true;

		try {
			const response = await fetch('/api/departments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dept_name: newDeptName.trim(), status: 'active' })
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				departmentsList = [resData.data, ...departmentsList];
				newDeptName = '';
				isNewNameTouched = false;
				formSuccess = 'Department created successfully!';
				setTimeout(() => {
					formSuccess = '';
				}, 3000);
			} else {
				formError = resData.error || 'Failed to create department.';
			}
		} catch (err) {
			formError = 'An error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	// Edit mode triggers
	function startEdit(dept: Department) {
		editingUuid = dept.uuid;
		editingName = dept.dept_name;
		editingStatus = dept.status;
		editError = '';
		isEditNameTouched = false;
	}

	// Cancel Edit
	function cancelEdit() {
		editingUuid = null;
		editingName = '';
		editError = '';
		isEditNameTouched = false;
	}

	// Save Edit
	async function handleSaveEdit(uuid: string) {
		isEditNameTouched = true;

		const validationError = getValidationError(editingName);
		if (validationError) {
			editError = validationError;
			return;
		}

		editError = '';
		isSavingEdit = true;

		try {
			const response = await fetch(`/api/departments?uuid=${uuid}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dept_name: editingName.trim(), status: editingStatus })
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				departmentsList = departmentsList.map((d) => (d.uuid === uuid ? resData.data : d));
				editingUuid = null;
				isEditNameTouched = false;
			} else {
				editError = resData.error || 'Failed to update department.';
			}
		} catch (err) {
			editError = 'An error occurred while saving changes.';
			console.error(err);
		} finally {
			isSavingEdit = false;
		}
	}

	// Soft Delete (Toggle Status to Inactive)
	async function handleSoftDelete(uuid: string) {
		if (!confirm('Are you sure you want to deactivate this department?')) {
			return;
		}

		try {
			const response = await fetch(`/api/departments?uuid=${uuid}`, {
				method: 'DELETE'
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				departmentsList = departmentsList.map((d) => (d.uuid === uuid ? resData.data : d));
			} else {
				alert(resData.error || 'Failed to deactivate department.');
			}
		} catch (err) {
			console.error(err);
			alert('An error occurred while deleting the department.');
		}
	}
</script>

<svelte:head>
	<title>HRMS Department Directory</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Department Directory</h1>
		<p class="text-muted-foreground">
			Manage and configure enterprise organizational units, monitor status, and register new departments.
		</p>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Departments</CardDescription>
				<CardTitle class="text-4xl font-bold tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Departments</CardDescription>
				<CardTitle class="text-4xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="grid items-start gap-8 lg:grid-cols-3">
		<!-- Left: Directory List -->
		<div class="space-y-4 lg:col-span-2">
			{#if loadError}
				<Alert variant="destructive">
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			{/if}

			<!-- Filters Bar -->
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div class="relative flex-1">
					<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						type="search"
						placeholder="Search by department name or UUID..."
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

				<div class="flex gap-2">
					<Button
						variant={statusFilter === 'all' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'all')}
					>
						All
					</Button>
					<Button
						variant={statusFilter === 'active' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'active')}
					>
						Active
					</Button>
					<Button
						variant={statusFilter === 'inactive' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'inactive')}
					>
						Inactive
					</Button>
				</div>
			</div>

			<!-- Main Directory Card -->
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-16">
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('dept_id')}>
									ID{sortIndicator('dept_id')}
								</Button>
							</TableHead>
							<TableHead>
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('dept_name')}>
									Department Name{sortIndicator('dept_name')}
								</Button>
							</TableHead>
							<TableHead class="w-28">
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('status')}>
									Status{sortIndicator('status')}
								</Button>
							</TableHead>
							<TableHead class="w-24 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if isLoading}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									<LoaderCircleIcon class="mx-auto size-6 animate-spin mb-2" />
									Loading departments...
								</TableCell>
							</TableRow>
						{:else if filteredDepartments.length === 0}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									No departments match the criteria.
								</TableCell>
							</TableRow>
						{:else}
							{#each filteredDepartments as dept (dept.uuid)}
								<TableRow>
									<!-- ID Cell -->
									<TableCell class="font-medium">#{dept.dept_id}</TableCell>

									<!-- Name & UUID Cell -->
									<TableCell>
										{#if editingUuid === dept.uuid}
											<div class="space-y-2">
												<Input
													type="text"
													bind:value={editingName}
													class="h-8 max-w-xs"
													placeholder="Department Name"
													required
												/>
												{#if editError}
													<p class="text-xs text-destructive">{editError}</p>
												{/if}
											</div>
										{:else}
											<div class="flex flex-col">
												<span class="font-semibold">{dept.dept_name}</span>
												<span class="font-mono text-[10px] text-muted-foreground leading-none mt-0.5">{dept.uuid}</span>
											</div>
										{/if}
									</TableCell>

									<!-- Status Badge Cell -->
									<TableCell>
										{#if editingUuid === dept.uuid}
											<select
												bind:value={editingStatus}
												class="flex h-8 w-24 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											>
												<option value="active">Active</option>
												<option value="inactive">Inactive</option>
											</select>
										{:else}
											<Badge variant={dept.status === 'active' ? 'default' : 'secondary'}>
												{dept.status}
											</Badge>
										{/if}
									</TableCell>

									<!-- Actions Cell -->
									<TableCell class="text-right">
										<div class="flex items-center justify-end gap-1.5">
											{#if editingUuid === dept.uuid}
												<Button
													size="icon-sm"
													variant="ghost"
													class="h-7 w-7 text-emerald-600 dark:text-emerald-400"
													aria-label="Save changes"
													disabled={isSavingEdit}
													onclick={() => handleSaveEdit(dept.uuid)}
												>
													{#if isSavingEdit}
														<LoaderCircleIcon class="size-3.5 animate-spin" />
													{:else}
														<CheckIcon class="size-3.5" />
													{/if}
												</Button>
												<Button
													size="icon-sm"
													variant="ghost"
													class="h-7 w-7 text-destructive"
													aria-label="Cancel editing"
													disabled={isSavingEdit}
													onclick={cancelEdit}
												>
													<BanIcon class="size-3.5" />
												</Button>
											{:else}
												<Button
													size="icon-sm"
													variant="ghost"
													class="h-7 w-7 text-muted-foreground hover:text-foreground"
													aria-label="Edit department"
													onclick={() => startEdit(dept)}
												>
													<PencilIcon class="size-3.5" />
												</Button>
												{#if dept.status === 'active'}
													<Button
														size="icon-sm"
														variant="ghost"
														class="h-7 w-7 text-muted-foreground hover:text-destructive"
														aria-label="Deactivate department"
														onclick={() => handleSoftDelete(dept.uuid)}
													>
														<Trash2Icon class="size-3.5" />
													</Button>
												{/if}
											{/if}
										</div>
									</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</Card>

			<p class="text-xs text-muted-foreground">
				Showing {filteredDepartments.length} of {totalCount} entries
			</p>
		</div>

		<!-- Right: Create Department Form -->
		<Card>
			<CardHeader>
				<CardTitle>Create Department</CardTitle>
				<CardDescription>
					Register a new organizational unit. Names must be unique and contain at least 2 characters.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleAddDepartment} class="space-y-4">
					<div class="space-y-2">
						<Label for="dept_name">Department Name</Label>
						<Input
							id="dept_name"
							bind:value={newDeptName}
							placeholder="e.g. Finance & Auditing"
							required
						/>
					</div>

					{#if formError}
						<div transition:slide>
							<Alert variant="destructive">
								<AlertDescription>{formError}</AlertDescription>
							</Alert>
						</div>
					{/if}

					{#if formSuccess}
						<div transition:slide>
							<Alert class="border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
								<AlertDescription>{formSuccess}</AlertDescription>
							</Alert>
						</div>
					{/if}

					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<LoaderCircleIcon class="size-4 animate-spin mr-2" />
							Creating...
						{:else}
							<PlusIcon class="size-4 mr-2" />
							Create Department
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
