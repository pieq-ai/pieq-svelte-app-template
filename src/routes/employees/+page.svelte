<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/toast.svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import {
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

	let employeesList = $state<Array<{ id: number; uuid: string; name: string; age: number }>>([]);
	let isLoading = $state(true);

	let searchQuery = $state('');
	let sortColumn = $state('id');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let newName = $state('');
	let newAge = $state('');
	let isSubmitting = $state(false);

	let filteredEmployees = $derived.by(() => {
		let result = [...employeesList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(emp) =>
					emp.name.toLowerCase().includes(query) ||
					emp.uuid.toLowerCase().includes(query) ||
					emp.id.toString().includes(query)
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

		try {
			const response = await fetch('/api/employees');
			const resData = await response.json();

			if (response.ok) {
				employeesList = resData.data ?? [];
			} else {
				toast.error(resData.error || 'Failed to load employees.');
			}
		} catch (err) {
			toast.error('An error occurred while loading employees.');
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
		const ageValue = Number(newAge);
		if (!newName.trim() || newAge === '' || newAge == null || isNaN(ageValue)) {
			toast.error('Please provide both Name and Age.');
			return;
		}

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
				toast.success('Employee added successfully!');
			} else {
				toast.error(resData.error || 'Failed to add employee.');
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>System Employees Directory</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">System Employees</h1>
		<p class="text-muted-foreground">
			Manage and monitor employee records with dynamic metrics and seamless creation.
		</p>
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

	<div class="grid items-start gap-8 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">


			<div class="relative">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by name, ID or UUID..."
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

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Button variant="ghost" size="sm" class="-ml-2 h-8" onclick={() => handleSort('id')}>
									ID {sortIndicator('id')}
								</Button>
							</TableHead>
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
							<TableHead>UUID</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if isLoading}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									Loading employees...
								</TableCell>
							</TableRow>
						{:else if filteredEmployees.length === 0}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									No employees match the criteria.
								</TableCell>
							</TableRow>
						{:else}
							{#each filteredEmployees as emp (emp.uuid)}
								<TableRow>
									<TableCell class="font-medium">#{emp.id}</TableCell>
									<TableCell class="font-semibold">{emp.name}</TableCell>
									<TableCell>
										<Badge variant="secondary">{emp.age} yrs old</Badge>
									</TableCell>
									<TableCell class="font-mono text-xs text-muted-foreground">{emp.uuid}</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</Card>

			<p class="text-xs text-muted-foreground">
				Showing {filteredEmployees.length} of {totalEmployees} entries
			</p>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Add New Employee</CardTitle>
				<CardDescription>
					Persist a new employee record in PostgreSQL via the API endpoint.
				</CardDescription>
			</CardHeader>
			<CardContent>
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



					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<LoaderCircleIcon class="size-4 animate-spin" />
							Saving Employee...
						{:else}
							Save Employee Record
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
