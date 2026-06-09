<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';

	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
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
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Employee = PageData['employees'][number];
	type SortColumn = 'id' | 'name' | 'age';

	let employees: Employee[] = $derived([...data.employees]);

	let searchQuery = $state('');
	let sortColumn = $state<SortColumn>('id');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let newName: string = $derived(
		form && 'name' in form && typeof form.name === 'string' ? form.name : ''
	);
	let newAge: string = $derived(
		form && 'age' in form && typeof form.age === 'string' ? form.age : ''
	);
	let isSubmitting = $state(false);
	let successMessage = $state('');

	let formError = $derived(form && 'error' in form ? form.error : null);

	let filteredEmployees = $derived.by(() => {
		let result = [...employees];

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
			const valA = a[sortColumn];
			const valB = b[sortColumn];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}

			return sortDirection === 'asc'
				? (valA as number) - (valB as number)
				: (valB as number) - (valA as number);
		});

		return result;
	});

	let totalEmployees = $derived(employees.length);
	let averageAge = $derived(
		totalEmployees > 0
			? Math.round(employees.reduce((acc, emp) => acc + emp.age, 0) / totalEmployees)
			: 0
	);
	let maxAge = $derived(
		totalEmployees > 0 ? Math.max(...employees.map((e) => e.age)) : 0
	);

	function handleSort(column: SortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}
</script>

<svelte:head>
	<title>Employees</title>
</svelte:head>

<div class="w-full space-y-8 px-1 py-4">
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
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2.5 h-8"
									onclick={() => handleSort('id')}
								>
									ID
									{#if sortColumn === 'id' && sortDirection === 'asc'}
										<ArrowUpIcon class="ml-2 size-4" />
									{:else if sortColumn === 'id' && sortDirection === 'desc'}
										<ArrowDownIcon class="ml-2 size-4" />
									{:else}
										<ArrowUpDownIcon class="ml-2 size-4" />
									{/if}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2.5 h-8"
									onclick={() => handleSort('name')}
								>
									Name
									{#if sortColumn === 'name' && sortDirection === 'asc'}
										<ArrowUpIcon class="ml-2 size-4" />
									{:else if sortColumn === 'name' && sortDirection === 'desc'}
										<ArrowDownIcon class="ml-2 size-4" />
									{:else}
										<ArrowUpDownIcon class="ml-2 size-4" />
									{/if}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2.5 h-8"
									onclick={() => handleSort('age')}
								>
									Age
									{#if sortColumn === 'age' && sortDirection === 'asc'}
										<ArrowUpIcon class="ml-2 size-4" />
									{:else if sortColumn === 'age' && sortDirection === 'desc'}
										<ArrowDownIcon class="ml-2 size-4" />
									{:else}
										<ArrowUpDownIcon class="ml-2 size-4" />
									{/if}
								</Button>
							</TableHead>
							<TableHead>UUID</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if filteredEmployees.length === 0}
							<TableRow>
								<TableCell colspan={7} class="py-8 text-center text-muted-foreground">
									{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
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
									<TableCell class="font-mono text-xs text-muted-foreground">
										{emp.uuid}
									</TableCell>
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
				<form
					method="POST"
					action="?/create"
					class="space-y-4"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							if (
								result.type === 'success' &&
								result.data &&
								'created' in result.data
							) {
								const created = result.data.created as Employee;
								employees = [created, ...employees];
								successMessage = 'Employee added successfully!';
								setTimeout(() => {
									successMessage = '';
								}, 3000);
								await update({ reset: true });
							} else {
								await update({ reset: false });
							}
							isSubmitting = false;
						};
					}}
				>
					<div class="space-y-2">
						<Label for="name">Full Name</Label>
						<Input
							id="name"
							name="name"
							bind:value={newName}
							placeholder="e.g. Charlie Brown"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="age">Age</Label>
						<Input
							id="age"
							name="age"
							type="number"
							bind:value={newAge}
							placeholder="e.g. 29"
							min="1"
							max="120"
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

					{#if successMessage}
						<div transition:slide>
							<Alert>
								<AlertDescription>{successMessage}</AlertDescription>
							</Alert>
						</div>
					{/if}

					<Button type="submit" class="w-full bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting}>
						{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>