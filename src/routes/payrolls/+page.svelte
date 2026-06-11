<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import EyeIcon from '@lucide/svelte/icons/eye';

	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';

	import {
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
		Pagination,
		SearchInput
	} from '$lib/components';

	import type { Payroll } from '$lib/types/payroll';

	// ─── Data state ──────────────────────────────────────────────────────────────

	let payrollList = $state<Payroll[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	// ─── Filter / sort / page state ──────────────────────────────────────────────

	let searchQuery = $state('');
	let monthFilter = $state<number | 'all'>('all');
	let yearFilter = $state<number | 'all'>('all');
	let sortColumn = $state('year');
	let sortDirection = $state<'asc' | 'desc' | null>('desc');

	let currentPage = $state(1);
	let pageSize = $state(10);

	// ─── Month / Year helpers ─────────────────────────────────────────────────────

	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	function monthName(month: number): string {
		return MONTH_NAMES[month - 1] ?? String(month);
	}

	function formatAmount(amount: number): string {
		return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	// ─── Derived filter options ───────────────────────────────────────────────────

	let availableYears = $derived(
		[...new Set(payrollList.map((p) => p.year))].sort((a, b) => b - a)
	);

	let availableMonths = $derived(
		[...new Set(payrollList.map((p) => p.month))].sort((a, b) => a - b)
	);

	// ─── Stats ────────────────────────────────────────────────────────────────────

	let totalRecords = $derived(payrollList.length);
	let uniqueEmployees = $derived(new Set(payrollList.map((p) => p.employee_cuid)).size);
	let uniqueMonths = $derived(new Set(payrollList.map((p) => `${p.year}-${p.month}`)).size);

	// ─── Filtered + sorted + paginated list ──────────────────────────────────────

	let filteredPayrolls = $derived.by(() => {
		let result = [...payrollList];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.employee_name.toLowerCase().includes(q) ||
					p.employee_code.toLowerCase().includes(q)
			);
		}

		if (monthFilter !== 'all') {
			result = result.filter((p) => p.month === monthFilter);
		}

		if (yearFilter !== 'all') {
			result = result.filter((p) => p.year === yearFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				let valA: string | number;
				let valB: string | number;

				switch (sortColumn) {
					case 'employee':
						valA = a.employee_name;
						valB = b.employee_name;
						break;
					case 'month':
						valA = a.month;
						valB = b.month;
						break;
					case 'year':
						valA = a.year;
						valB = b.year;
						break;
					case 'net_salary':
						valA = a.net_salary;
						valB = b.net_salary;
						break;
					default:
						valA = String(a[sortColumn as keyof typeof a] ?? '');
						valB = String(b[sortColumn as keyof typeof b] ?? '');
				}

				if (typeof valA === 'number' && typeof valB === 'number') {
					return sortDirection === 'asc' ? valA - valB : valB - valA;
				}
				return sortDirection === 'asc'
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		}

		return result;
	});

	let paginatedPayrolls = $derived(
		filteredPayrolls.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	// ─── Data loading ─────────────────────────────────────────────────────────────

	async function loadPayrolls() {
		isLoading = true;
		loadError = '';
		try {
			const res = await fetch('/api/payrolls');
			const data = await res.json();
			if (res.ok) {
				payrollList = data.data ?? [];
			} else {
				loadError = data.message || 'Failed to load payroll records.';
				toast.error(loadError);
			}
		} catch (err) {
			loadError = 'An error occurred while loading data.';
			toast.error(loadError);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadPayrolls();
	});

	// ─── Sorting ──────────────────────────────────────────────────────────────────

	function handleSort(column: string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') sortDirection = 'desc';
			else if (sortDirection === 'desc') sortDirection = null;
			else sortDirection = 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	function sortIcon(col: string) {
		if (sortColumn !== col) return 'none';
		return sortDirection === 'asc' ? 'asc' : sortDirection === 'desc' ? 'desc' : 'none';
	}
</script>

<svelte:head>
	<title>HRMS — Payroll</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Page header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Payroll</h1>
			<p class="text-sm text-muted-foreground">Manage and view employee payroll records.</p>
		</div>
		<Button
			type="button"
			class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
			onclick={() => goto(resolve('/payrolls/upload'))}
		>
			<UploadIcon class="size-4" />
			Upload Payroll
		</Button>
	</div>

	<!-- Stats cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Records</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalRecords}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Employees</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{uniqueEmployees}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Pay Periods</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{uniqueMonths}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<!-- Filters + table -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
			<SearchInput
				id="search_payrolls"
				name="search_payrolls"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by employee name or code..."
			/>

			<!-- Month filter -->
			<select
				class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
				bind:value={monthFilter}
				onchange={() => (currentPage = 1)}
				aria-label="Filter by month"
			>
				<option value="all">All Months</option>
				{#each availableMonths as m (m)}
					<option value={m}>{monthName(m)}</option>
				{/each}
			</select>

			<!-- Year filter -->
			<select
				class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
				bind:value={yearFilter}
				onchange={() => (currentPage = 1)}
				aria-label="Filter by year"
			>
				<option value="all">All Years</option>
				{#each availableYears as y (y)}
					<option value={y}>{y}</option>
				{/each}
			</select>
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('employee')}>
								Employee
								{#if sortIcon('employee') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('employee') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('month')}>
								Month
								{#if sortIcon('month') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('month') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('year')}>
								Year
								{#if sortIcon('year') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('year') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('net_salary')}>
								Net Salary
								{#if sortIcon('net_salary') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('net_salary') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading payroll records...
							</TableCell>
						</TableRow>
					{:else if filteredPayrolls.length === 0}
						<TableRow>
							<TableCell colspan={5} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedPayrolls as p (p.cuid)}
							<TableRow
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									goto(resolve(`/payrolls/${p.cuid}`));
								}}
								class="cursor-pointer"
							>
								<TableCell>
									<span class="font-semibold">{p.employee_name}</span>
									<span class="block text-xs text-muted-foreground">{p.employee_code}</span>
								</TableCell>
								<TableCell>{monthName(p.month)}</TableCell>
								<TableCell>{p.year}</TableCell>
								<TableCell class="text-right font-mono font-semibold">₹{formatAmount(p.net_salary)}</TableCell>
								<TableCell class="text-right">
									<div
										class="flex items-center justify-end gap-1"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => e.stopPropagation()}
										role="presentation"
									>
										<Button
											variant="ghost"
											size="icon-sm"
											class="h-8 w-8 text-muted-foreground hover:text-foreground"
											onclick={() => goto(resolve(`/payrolls/${p.cuid}`))}
											aria-label="View payroll"
										>
											<EyeIcon class="size-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage pageSize={pageSize} totalItems={filteredPayrolls.length} />
	</div>
</div>
