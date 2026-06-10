<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		Input,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Employee = PageData['employees'][number];
	type SortColumn = 'emp_code' | 'first_name' | 'last_name' | 'personal_email';

	let employees: Employee[] = $derived([...data.employees]);

	let searchQuery = $state('');
	let sortColumn = $state<SortColumn>('emp_code');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let filteredEmployees = $derived.by(() => {
		let result = [...employees];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(emp) =>
					emp.emp_code?.toLowerCase().includes(query) ||
					emp.first_name?.toLowerCase().includes(query) ||
					emp.last_name?.toLowerCase().includes(query) ||
					emp.personal_email?.toLowerCase().includes(query)
			);
		}

		result.sort((a, b) => {
			const valA = a[sortColumn] || '';
			const valB = b[sortColumn] || '';

			return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
		});

		return result;
	});

	let totalEmployees = $derived(employees.length);

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
		return sortDirection === 'asc' ? '↑' : '↓';
	}
</script>

<svelte:head>
	<title>Employees Directory</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8">
	<div class="flex items-center justify-between border-b border-border pb-6">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Employees</h1>
			<p class="text-muted-foreground">
				Manage and monitor employee records in the organization.
			</p>
		</div>
		<div>
			<Button href="/employees/create" class="bg-[#F45310] text-white hover:bg-[#F45310]/90">
				<PlusIcon class="mr-2 size-4" />
				Add Employee
			</Button>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription>Total Active Employees</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalEmployees}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-4">
		<div class="relative max-w-sm">
			<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input
				type="search"
				placeholder="Search by code, name, email..."
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
								onclick={() => handleSort('emp_code')}
							>
								Emp Code {sortIndicator('emp_code')}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								class="-ml-2 h-8"
								onclick={() => handleSort('first_name')}
							>
								First Name {sortIndicator('first_name')}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								class="-ml-2 h-8"
								onclick={() => handleSort('last_name')}
							>
								Last Name {sortIndicator('last_name')}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								class="-ml-2 h-8"
								onclick={() => handleSort('personal_email')}
							>
								Email {sortIndicator('personal_email')}
							</Button>
						</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredEmployees.length === 0}
						<TableRow>
							<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredEmployees as emp (emp.cuid)}
							<TableRow>
								<TableCell class="font-medium text-xs">#{emp.emp_code}</TableCell>
								<TableCell class="font-semibold">{emp.first_name}</TableCell>
								<TableCell class="font-semibold">{emp.last_name || '-'}</TableCell>
								<TableCell class="text-muted-foreground">
									{emp.personal_email || '-'}
								</TableCell>
								<TableCell class="text-right">
									<Button variant="ghost" size="sm" href={`/employees/${emp.cuid}`}>
										View
									</Button>
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
</div>