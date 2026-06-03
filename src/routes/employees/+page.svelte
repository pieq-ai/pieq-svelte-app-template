<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Input,
		Label
	} from '$lib/components';
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

	function sortIndicator(column: SortColumn) {
		if (sortColumn !== column) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	function openAddModal() {
		newName = '';
		newAge = '';
		errorMessage = '';
		successMessage = '';
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
		newName = '';
		newAge = '';
		errorMessage = '';
	}
</script>

<svelte:head>
	<title>Employees – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#F453101a;color:#F45310;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Employees
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Manage and monitor employee records with dynamic metrics.
		</p>
	</div>

	<button class="btn-add-entity" onclick={openAddModal} id="add-employee-btn">
		<PlusIcon size={16} />
		Add Employee
	</button>
</div>

<!-- Stats -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-card-label">Total Employees</div>
		<div class="stat-card-value">{totalEmployees}</div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Total registered enterprise employees</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Average Age</div>
		<div class="stat-card-value" style="color: #F45310">{averageAge}<span style="font-size:16px;font-weight:400;color:var(--muted-foreground)"> yrs</span></div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Mean age of workforce</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Max Registered Age</div>
		<div class="stat-card-value" style="color: #800020">{maxAge}<span style="font-size:16px;font-weight:400;color:var(--muted-foreground)"> yrs</span></div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Highest employee age recorded</div>
	</div>
</div>

<!-- Success toast -->
{#if successMessage}
	<div transition:slide style="margin-bottom:16px">
		<Alert>
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	</div>
{/if}

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
									class="-ml-2 h-8"
									onclick={() => handleSort('id')}
								>
									ID {sortIndicator('id')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2 h-8"
									onclick={() => handleSort('name')}
								>
									Name {sortIndicator('name')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									class="-ml-2 h-8"
									onclick={() => handleSort('age')}
								>
									Age {sortIndicator('age')}
								</Button>
							</TableHead>
							<TableHead>UUID</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if filteredEmployees.length === 0}
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

				<div style="display:flex;justify-content:flex-end;gap:10px;padding-top:4px">
					<button
						type="submit"
						disabled={isSubmitting}
						style="padding:9px 18px;border-radius:8px;background:#F45310;color:white;border:none;font-size:13px;font-weight:600;cursor:pointer;opacity:{isSubmitting ? 0.7 : 1};display:inline-flex;align-items:center;gap:6px"
					>
						{#if isSubmitting}
							<LoaderCircleIcon class="animate-spin" size={14} />
						{/if}
						{isSubmitting ? 'Saving...' : 'Save Employee'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
