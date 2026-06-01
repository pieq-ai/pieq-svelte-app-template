<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { createDirtyChecker } from '$lib/utils';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CrudModal,
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

	let employeesList = $state<Array<{ cuid2: string; name: string; age: number }>>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let newName = $state('');
	let newAge = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let isCreateModalOpen = $state(false);

	const dirtyChecker = createDirtyChecker<{ name: string; age: string }>();
	let isDirty = $derived(dirtyChecker.isDirty({ name: newName.trim(), age: newAge }));

	function openCreateModal() {
		newName = '';
		newAge = '';
		dirtyChecker.snapshot({ name: '', age: '' });
		isCreateModalOpen = true;
	}

	let filteredEmployees = $derived.by(() => {
		let result = [...employeesList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(emp) =>
					emp.name.toLowerCase().includes(query) ||
					emp.cuid2.toLowerCase().includes(query)
			);
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

	let totalEmployees = $derived(employeesList.length);
	let averageAge = $derived(
		totalEmployees > 0
			? Math.round(employeesList.reduce((acc, emp) => acc + emp.age, 0) / totalEmployees)
			: 0
	);
	let maxAge = $derived(
		totalEmployees > 0 ? Math.max(...employeesList.map((e) => e.age)) : 0
	);

	async function loadEmployees() {
		isLoading = true;
		loadError = '';

		try {
			const response = await fetch('/api/employees');
			const resData = await response.json();

			if (response.ok) {
				employeesList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load employees.';
			}
		} catch (err) {
			loadError = 'An error occurred while loading employees.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadEmployees();
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
		return sortDirection === 'asc' ? '↑' : '↓';
	}

	async function handleAddEmployee(e: Event) {
		e.preventDefault();
		if (!isDirty) return;
		const ageValue = Number(newAge);
		if (!newName.trim() || newAge === '' || newAge == null || isNaN(ageValue)) {
			errorMessage = 'Please provide both Name and Age.';
			return;
		}

		errorMessage = '';
		successMessage = '';
		isSubmitting = true;

		try {
			const response = await fetch('/api/employees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName.trim(), age: ageValue })
			});

			const resData = await response.json();

			if (response.ok && resData.data) {
				employeesList = [resData.data, ...employeesList];
				newName = '';
				newAge = '';
				isCreateModalOpen = false;
				successMessage = 'Employee added successfully!';
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				errorMessage = resData.error || 'Failed to add employee.';
			}
		} catch (err) {
			errorMessage = 'An error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>System Employees Directory</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-5 px-4 py-6">
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">System Employees</h1>
			<p class="text-muted-foreground">
				Manage and monitor employee records with dynamic metrics and seamless creation.
			</p>
		</div>
		<Button
			type="button"
			class="bg-[#C2652A] text-white hover:bg-[#8C3C3C]"
			onclick={openCreateModal}
		>
			<PlusIcon class="size-4" />
			Add Employee
		</Button>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription>Total Active Employees</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalEmployees}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Average Employee Age</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{averageAge} yrs</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader>
				<CardDescription>Max Registered Age</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{maxAge} yrs</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<div class="space-y-4">
			{#if loadError}
				<Alert variant="destructive">
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			{/if}
			{#if successMessage}
				<div transition:slide>
					<Alert>
						<AlertDescription>{successMessage}</AlertDescription>
					</Alert>
				</div>
			{/if}

			<div class="relative">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by name or CUID2..."
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

			<Card class="py-0">
			<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('name')}>
									Name {sortIndicator('name')}
								</Button>
							</TableHead>
							<TableHead>
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('age')}>
									Age {sortIndicator('age')}
								</Button>
							</TableHead>
							<TableHead>CUID2</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if isLoading}
							<TableRow>
								<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
									Loading employees...
								</TableCell>
							</TableRow>
						{:else if filteredEmployees.length === 0}
							<TableRow>
								<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
									No employees match the criteria.
								</TableCell>
							</TableRow>
						{:else}
							{#each filteredEmployees as emp (emp.cuid2)}
								<TableRow>
									<TableCell class="font-semibold">{emp.name}</TableCell>
									<TableCell>
										<Badge variant="secondary">{emp.age} yrs old</Badge>
									</TableCell>
									<TableCell class="font-mono text-xs text-muted-foreground">{emp.cuid2}</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</Card>

			<p class="text-sm text-muted-foreground">
				Showing {filteredEmployees.length === 0 ? 0 : 1}-{filteredEmployees.length} of {filteredEmployees.length} record{filteredEmployees.length === 1 ? '' : 's'}
			</p>
		</div>

	</div>

	{#if isCreateModalOpen}
		<CrudModal
			open={isCreateModalOpen}
			title="Add New Employee"
			description="Persist a new employee record in PostgreSQL via the API endpoint."
			isDirty={isDirty}
			onClose={() => (isCreateModalOpen = false)}
		>
			<form onsubmit={handleAddEmployee} class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Full Name</Label>
					<Input id="name" bind:value={newName} placeholder="e.g. Charlie Brown" required />
				</div>

				<div class="space-y-2">
					<Label for="age">Age</Label>
					<Input
						id="age"
						type="number"
						bind:value={newAge}
						placeholder="e.g. 29"
						min="1"
						max="120"
						required
					/>
				</div>

				{#if errorMessage}
					<div transition:slide>
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					</div>
				{/if}

				<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting || !isDirty}>
					{#if isSubmitting}
						<LoaderCircleIcon class="size-4 animate-spin" />
						Saving Employee...
					{:else}
						Save Employee Record
					{/if}
				</Button>
			</form>
		</CrudModal>
	{/if}
</div>
