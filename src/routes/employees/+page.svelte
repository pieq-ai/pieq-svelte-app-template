<script lang="ts">
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		TableActions,
		Pagination,
		SearchInput,
		FilterDropdown
	} from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import { toast } from '$lib/toast';
	import { goto } from '$app/navigation';

	interface Employee {
		cuid: string;
		emp_code: string;
		first_name: string;
		last_name: string;
		personal_email: string;
		profile_completion_status: string;
	}

	let { data } = $props<{ data: { employees: Employee[] } }>();

	let employees = $derived<Employee[]>(data.employees);
	let isLoading = $state(false);
	let loadError = $state('');

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'pending' | 'completed'>('all');
	let sortColumn = $state('emp_code');
	let sortDirection = $state<'asc' | 'desc' | null>('asc');

	let currentPage = $state(1);
	let pageSize = $state(10);

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

		if (statusFilter !== 'all') {
			result = result.filter(
				(emp) => emp.profile_completion_status === statusFilter
			);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof typeof a] || '';
				const valB = b[sortColumn as keyof typeof b] || '';

				return sortDirection === 'asc'
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		}

    return result;
  });

	let totalEmployees = $derived(employees.length);
	let completedCount = $derived(employees.filter((e) => e.profile_completion_status === 'completed').length);
	let pendingCount = $derived(employees.filter((e) => e.profile_completion_status === 'pending').length);
	let paginatedEmployees = $derived(filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	function handleSort(column: string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') sortDirection = 'desc';
			else if (sortDirection === 'desc') sortDirection = null;
			else sortDirection = 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function isInteractive(target: HTMLElement | null, rowElement: HTMLElement): boolean {
		let curr = target;
		while (curr && curr !== rowElement) {
			const tagName = curr.tagName.toLowerCase();
			if (
				tagName === 'a' ||
				tagName === 'button' ||
				tagName === 'input' ||
				tagName === 'select' ||
				tagName === 'textarea' ||
				curr.getAttribute('role') === 'button' ||
				curr.classList.contains('kebab-dropdown-menu')
			) {
				return true;
			}
			curr = curr.parentElement;
		}
		return false;
	}

	function handleRowClick(cuid: string, event: MouseEvent) {
		const target = event.target as HTMLElement;
		const row = event.currentTarget as HTMLElement;
		if (isInteractive(target, row)) return;
		goto(`/employees/${cuid}?mode=edit`);
	}
</script>

<svelte:head>
	<title>Employees</title>
</svelte:head>

<div class="w-full space-y-4 px-1 py-0">
	<div class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Employees</h1>
		</div>
		<Button
			href="/employees/create"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
		>
			Add Employee
		</Button>
	</div>

	<!-- Metrics Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Employees</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalEmployees}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Completed Profiles</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{completedCount}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Pending Profiles</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{pendingCount}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput id="search_employees" name="search_employees" bind:value={searchQuery} oninput={() => (currentPage = 1)} placeholder="Search by code, name, email..." />
			<FilterDropdown value={statusFilter} onChange={(value) => { statusFilter = value; currentPage = 1; }} options={[{ label: 'All Status', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Completed', value: 'completed' }]} />
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('emp_code')}>
								Emp Code
								{#if sortColumn === 'emp_code' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'emp_code' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('first_name')}>
								First Name
								{#if sortColumn === 'first_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'first_name' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('last_name')}>
								Last Name
								{#if sortColumn === 'last_name' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'last_name' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('personal_email')}>
								Email
								{#if sortColumn === 'personal_email' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'personal_email' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('profile_completion_status')}>
								Status
								{#if sortColumn === 'profile_completion_status' && sortDirection === 'asc'}
									<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortColumn === 'profile_completion_status' && sortDirection === 'desc'}
									<ArrowDownIcon class="ml-2 size-4" />
								{:else}
									<ArrowUpDownIcon class="ml-2 size-4" />
								{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading employees...
							</TableCell>
						</TableRow>
					{:else if filteredEmployees.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedEmployees as emp (emp.cuid)}
							<TableRow onclick={(e) => handleRowClick(emp.cuid, e)} class="cursor-pointer">
								<TableCell class="font-medium text-xs">#{emp.emp_code}</TableCell>
								<TableCell class="font-semibold">{emp.first_name}</TableCell>
								<TableCell class="font-semibold">{emp.last_name || '-'}</TableCell>
								<TableCell class="text-muted-foreground">
									{emp.personal_email || '-'}
								</TableCell>
								<TableCell class="text-center">
									<Badge variant={emp.profile_completion_status === 'completed' ? 'default' : 'secondary'}>
										{emp.profile_completion_status === 'completed' ? 'Completed' : 'Pending'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<TableActions
										canEdit={true}
										canView={false}
										editLabel="Edit"
										onEdit={() => goto(`/employees/${emp.cuid}?mode=edit`)}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<Pagination bind:currentPage={currentPage} pageSize={pageSize} totalItems={filteredEmployees.length} />
	</div>
</div>
