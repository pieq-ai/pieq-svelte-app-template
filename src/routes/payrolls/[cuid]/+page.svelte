<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import EyeIcon from '@lucide/svelte/icons/eye';

	import { UI_CONSTANTS } from '$lib/constants';

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
		Pagination,
		SearchInput,
		TableActions
	} from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { Payroll } from '$lib/types/payroll';

	// ─── Props ────────────────────────────────────────────────────────────────────

	let { data } = $props();
	let upload = $derived(data.upload);
	let records = $derived<Payroll[]>(data.records);

	// ─── Helpers ──────────────────────────────────────────────────────────────────

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

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-IN', {
			day: '2-digit', month: 'short', year: 'numeric'
		});
	}

	function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'processed') return 'default';
		if (status === 'partial') return 'secondary';
		if (status === 'failed') return 'destructive';
		return 'outline';
	}

	// ─── Filter / sort / page state ──────────────────────────────────────────────

	let searchQuery = $state('');
	let sortColumn = $state('employee_code');
	let sortDirection = $state<'asc' | 'desc' | null>('asc');
	let currentPage = $state(1);
	let pageSize = $state(10);

	// ─── Filtered + sorted + paginated ───────────────────────────────────────────

	let filteredRecords = $derived.by(() => {
		let result = [...records];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(r) =>
					r.employee_name.toLowerCase().includes(q) ||
					r.employee_code.toLowerCase().includes(q)
			);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				let valA: string | number;
				let valB: string | number;

				switch (sortColumn) {
					case 'employee':
						valA = a.employee_name; valB = b.employee_name; break;
					case 'employee_code':
						valA = a.employee_code; valB = b.employee_code; break;
					case 'gross_earnings':
						valA = a.gross_earnings; valB = b.gross_earnings; break;
					case 'net_salary':
						valA = a.net_salary; valB = b.net_salary; break;
					default:
						valA = String((a as unknown as Record<string, unknown>)[sortColumn] ?? '');
						valB = String((b as unknown as Record<string, unknown>)[sortColumn] ?? '');
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

	let paginatedRecords = $derived(
		filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

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
	<title>HRMS Payroll — {monthName(upload.month)} {upload.year}</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Page header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex items-center gap-3">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="h-9 w-9 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/payrolls'))}
				aria-label="Back to Payroll"
			>
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div class="space-y-0.5">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
					{monthName(upload.month)} {upload.year}
				</h1>
				<p class="text-sm text-muted-foreground">Payroll Upload Batch</p>
			</div>
		</div>

	</div>

	<!-- Upload summary cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Pay Period</CardDescription>
				<CardTitle class="text-2xl font-bold text-[#262626]">{monthName(upload.month)} {upload.year}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Employees</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{upload.employee_count}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Uploaded On</CardDescription>
				<CardTitle class="text-2xl font-bold text-[#800020]">{formatDate(upload.uploaded_at)}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<!-- Payroll records table -->
	<div class="space-y-3">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-lg font-semibold">Employee Payroll Records</h2>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<SearchInput
				id="search_payroll_records"
				name="search_payroll_records"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by employee name or code..."
			/>
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
						<TableHead class="text-center font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="mx-auto flex items-center justify-center font-bold text-foreground text-[15px]" onclick={() => handleSort('gross_earnings')}>
								Gross Earnings
								{#if sortIcon('gross_earnings') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('gross_earnings') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="mx-auto flex items-center justify-center font-bold text-foreground text-[15px]" onclick={() => handleSort('net_salary')}>
								Net Salary
								{#if sortIcon('net_salary') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('net_salary') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if filteredRecords.length === 0}
						<TableRow>
							<TableCell colspan={4} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedRecords as r (r.cuid)}
							<TableRow
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									goto(resolve(`/payroll-records/${r.cuid}`));
								}}
								class="cursor-pointer hover:bg-muted/70 transition-colors"
							>
								<TableCell>
									<span class="font-semibold text-foreground block">{r.employee_name}</span>
									<span class="block text-xs text-muted-foreground font-mono mt-0.5">{r.employee_code}</span>
								</TableCell>
								<TableCell class="text-center font-mono font-medium">₹{formatAmount(r.gross_earnings)}</TableCell>
								<TableCell class="text-center font-mono font-semibold">₹{formatAmount(r.net_salary)}</TableCell>
								<TableCell class="text-right w-24">
									<TableActions canEdit={false}>
										<DropdownMenu.Item onclick={() => goto(resolve(`/payroll-records/${r.cuid}`))} class="cursor-pointer">
											<EyeIcon class="mr-2 size-4 text-muted-foreground" />
											View Details
										</DropdownMenu.Item>
									</TableActions>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
		<Pagination bind:currentPage pageSize={pageSize} totalItems={filteredRecords.length} />
	</div>
</div>
