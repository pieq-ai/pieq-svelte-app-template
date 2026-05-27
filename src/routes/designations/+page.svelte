<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import BanIcon from '@lucide/svelte/icons/ban';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';

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

	interface Designation {
		designation_id: number;
		uuid: string;
		designation_name: string;
		status: 'active' | 'inactive';
	}

	let designationsList = $state<Designation[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
	let sortColumn = $state('designation_name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let newDesignationName = $state('');
	let isSubmitting = $state(false);
	let formError = $state('');
	let formSuccess = $state('');
	let isNewNameTouched = $state(false);

	let editingId = $state<number | null>(null);
	let editingName = $state('');
	let editingStatus = $state<'active' | 'inactive'>('active');
	let isSavingEdit = $state(false);
	let editError = $state('');
	let isEditNameTouched = $state(false);

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') {
			return 'Designation name is required';
		}
		const regex = /^[A-Za-z ]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters and spaces are allowed';
		}
		return '';
	}

	let newNameValidationError = $derived(
		isNewNameTouched ? getValidationError(newDesignationName) : ''
	);
	let editNameValidationError = $derived(isEditNameTouched ? getValidationError(editingName) : '');

	let filteredDesignations = $derived.by(() => {
		let result = [...designationsList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(designation) =>
					designation.designation_name.toLowerCase().includes(query) ||
					designation.uuid.toLowerCase().includes(query) ||
					designation.designation_id.toString().includes(query)
			);
		}

		if (statusFilter !== 'all') {
			result = result.filter((designation) => designation.status === statusFilter);
		}

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

	let totalCount = $derived(designationsList.length);
	let activeCount = $derived(designationsList.filter((designation) => designation.status === 'active').length);
	let inactiveCount = $derived(
		designationsList.filter((designation) => designation.status === 'inactive').length
	);

	async function loadDesignations() {
		isLoading = true;
		loadError = '';

		try {
			const response = await fetch('/api/designations');
			const resData = await response.json();

			if (response.ok) {
				designationsList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load designations.';
			}
		} catch (err) {
			loadError = 'An error occurred while loading designations.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDesignations();
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

	async function handleAddDesignation(e: Event) {
		e.preventDefault();
		isNewNameTouched = true;

		const validationError = getValidationError(newDesignationName);
		if (validationError) {
			formError = validationError;
			return;
		}

		formError = '';
		formSuccess = '';
		isSubmitting = true;

		try {
			const response = await fetch('/api/designations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ designation_name: newDesignationName.trim(), status: 'active' })
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				designationsList = [resData.data, ...designationsList];
				newDesignationName = '';
				isNewNameTouched = false;
				formSuccess = 'Designation created successfully.';
				setTimeout(() => {
					formSuccess = '';
				}, 3000);
			} else {
				formError = resData.error || 'Failed to create designation.';
			}
		} catch (err) {
			formError = 'An error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	function startEdit(designation: Designation) {
		editingId = designation.designation_id;
		editingName = designation.designation_name;
		editingStatus = designation.status;
		editError = '';
		isEditNameTouched = false;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
		editError = '';
		isEditNameTouched = false;
	}

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
			const response = await fetch(`/api/designations?uuid=${uuid}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ designation_name: editingName.trim(), status: editingStatus })
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				designationsList = designationsList.map((designation) =>
					designation.uuid === uuid ? resData.data : designation
				);
				editingId = null;
				isEditNameTouched = false;
			} else {
				editError = resData.error || 'Failed to update designation.';
			}
		} catch (err) {
			editError = 'An error occurred while saving changes.';
			console.error(err);
		} finally {
			isSavingEdit = false;
		}
	}

	async function handleSoftDelete(uuid: string) {
		if (!confirm('Are you sure you want to deactivate this designation?')) {
			return;
		}

		try {
			const response = await fetch(`/api/designations?uuid=${uuid}`, {
				method: 'DELETE'
			});
			const resData = await response.json();

			if (response.ok && resData.data) {
				designationsList = designationsList.map((designation) =>
					designation.uuid === uuid ? resData.data : designation
				);
			} else {
				alert(resData.error || 'Failed to deactivate designation.');
			}
		} catch (err) {
			console.error(err);
			alert('An error occurred while deactivating the designation.');
		}
	}
</script>

<svelte:head>
	<title>HRMS Designation Directory</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Designation Directory</h1>
		<p class="text-muted-foreground">
			Manage enterprise job titles used by employment records and reporting structures.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Designations</CardDescription>
				<CardTitle class="text-4xl font-bold tabular-nums">{totalCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Inactive Designations</CardDescription>
				<CardTitle class="text-4xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{inactiveCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="grid items-start gap-8 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			{#if loadError}
				<Alert variant="destructive">
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			{/if}

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div class="relative flex-1">
					<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						type="search"
						placeholder="Search by designation name, ID or UUID..."
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

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-16">
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2 h-8"
									onclick={() => handleSort('designation_id')}
								>
									ID{sortIndicator('designation_id')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2 h-8"
									onclick={() => handleSort('designation_name')}
								>
									Designation Name{sortIndicator('designation_name')}
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
									<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
									Loading designations...
								</TableCell>
							</TableRow>
						{:else if filteredDesignations.length === 0}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									No designations match the criteria.
								</TableCell>
							</TableRow>
						{:else}
							{#each filteredDesignations as designation (designation.uuid)}
								<TableRow>
									<TableCell class="font-medium">#{designation.designation_id}</TableCell>
									<TableCell>
										{#if editingId === designation.designation_id}
											<div class="space-y-2">
												<Input
													type="text"
													bind:value={editingName}
													class={`h-8 max-w-xs${editNameValidationError ? ' border-destructive' : ''}`}
													placeholder="Designation Name"
													oninput={() => (isEditNameTouched = true)}
													required
												/>
												{#if editNameValidationError}
													<p class="text-xs text-destructive">{editNameValidationError}</p>
												{:else if editError}
													<p class="text-xs text-destructive">{editError}</p>
												{/if}
											</div>
										{:else}
											<div class="flex flex-col">
												<span class="font-semibold">{designation.designation_name}</span>
												<span class="mt-0.5 font-mono text-[10px] leading-none text-muted-foreground">{designation.uuid}</span>
											</div>
										{/if}
									</TableCell>
									<TableCell>
										{#if editingId === designation.designation_id}
											<select
												bind:value={editingStatus}
												class="flex h-8 w-24 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											>
												<option value="active">Active</option>
												<option value="inactive">Inactive</option>
											</select>
										{:else}
											<Badge variant={designation.status === 'active' ? 'default' : 'secondary'}>
												{designation.status}
											</Badge>
										{/if}
									</TableCell>
									<TableCell class="text-right">
										<div class="flex items-center justify-end gap-1.5">
											{#if editingId === designation.designation_id}
												<Button
													size="icon-sm"
													variant="ghost"
													class="h-7 w-7 text-emerald-600 dark:text-emerald-400"
													aria-label="Save changes"
													disabled={isSavingEdit}
													onclick={() => handleSaveEdit(designation.uuid)}
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
													aria-label="Edit designation"
													onclick={() => startEdit(designation)}
												>
													<PencilIcon class="size-3.5" />
												</Button>
												{#if designation.status === 'active'}
													<Button
														size="icon-sm"
														variant="ghost"
														class="h-7 w-7 text-muted-foreground hover:text-destructive"
														aria-label="Deactivate designation"
														onclick={() => handleSoftDelete(designation.uuid)}
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
				Showing {filteredDesignations.length} of {totalCount} entries
			</p>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Create Designation</CardTitle>
				<CardDescription>
					Register a job title for assignment in employee employment records.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleAddDesignation} class="space-y-4">
					<div class="space-y-2">
						<Label for="designation_name">Designation Name</Label>
						<Input
							id="designation_name"
							bind:value={newDesignationName}
							placeholder="e.g. Senior HR Manager"
							class={newNameValidationError ? 'border-destructive' : ''}
							oninput={() => (isNewNameTouched = true)}
							required
						/>
						{#if newNameValidationError}
							<p class="text-xs text-destructive">{newNameValidationError}</p>
						{/if}
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
							<LoaderCircleIcon class="mr-2 size-4 animate-spin" />
							Creating...
						{:else}
							<PlusIcon class="mr-2 size-4" />
							Create Designation
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
