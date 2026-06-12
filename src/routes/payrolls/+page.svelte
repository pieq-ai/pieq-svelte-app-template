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
	import CheckIcon from '@lucide/svelte/icons/check';
	import FilterIcon from '@lucide/svelte/icons/filter';

	import type { PayrollUpload } from '$lib/types/payroll';

	// ─── Data state ──────────────────────────────────────────────────────────────

	let uploadList = $state<PayrollUpload[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	// ─── Filter / sort / page state ──────────────────────────────────────────────

	let searchQuery = $state('');
	let yearFilter = $state<number | 'all'>('all');
	let sortColumn = $state('uploaded_at');
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

	function statusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	// ─── Derived filter options ───────────────────────────────────────────────────

	let availableYears = $derived(
		[...new Set(uploadList.map((u) => u.year))].sort((a, b) => b - a)
	);

	// ─── Stats ────────────────────────────────────────────────────────────────────

	let totalUploads = $derived(uploadList.length);
	let employeesProcessed = $derived(uploadList.reduce((sum, u) => sum + u.employee_count, 0));
	let payPeriods = $derived(new Set(uploadList.map((u) => `${u.year}-${u.month}`)).size);

	// ─── Filtered + sorted + paginated list ──────────────────────────────────────

	let filteredUploads = $derived.by(() => {
		let result = [...uploadList];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(u) =>
					monthName(u.month).toLowerCase().includes(q) ||
					String(u.year).includes(q) ||
					u.status.toLowerCase().includes(q)
			);
		}

		if (yearFilter !== 'all') {
			result = result.filter((u) => u.year === yearFilter);
		}

		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				let valA: string | number;
				let valB: string | number;

				switch (sortColumn) {
					case 'month':
						valA = a.month; valB = b.month; break;
					case 'year':
						valA = a.year; valB = b.year; break;
					case 'employees':
						valA = a.employee_count; valB = b.employee_count; break;
					case 'uploaded_at':
						valA = a.uploaded_at; valB = b.uploaded_at; break;
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

	let paginatedUploads = $derived(
		filteredUploads.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	// ─── Data loading ─────────────────────────────────────────────────────────────

	async function loadUploads() {
		isLoading = true;
		loadError = '';
		try {
			const res = await fetch('/api/payroll-uploads');
			const data = await res.json();
			if (res.ok) {
				uploadList = data.data ?? [];
			} else {
				loadError = data.message || 'Failed to load payroll uploads.';
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
		loadUploads();
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
	<title>HRMS Payroll</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Page header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Payroll</h1>
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
				<CardDescription>Total Uploads</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalUploads}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Employees Processed</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{employeesProcessed}</CardTitle>
			</CardHeader>
		</Card>
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Pay Periods</CardDescription>
				<CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{payPeriods}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<!-- Filters + table -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
			<SearchInput
				id="search_payroll_uploads"
				name="search_payroll_uploads"
				bind:value={searchQuery}
				oninput={() => (currentPage = 1)}
				placeholder="Search by month, year or status..."
			/>

			<!-- Year filter -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" class="h-9 w-[180px] justify-between border-input bg-background shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
							{yearFilter === 'all' ? 'All Years' : yearFilter}
							<FilterIcon class="ml-2 size-4 opacity-50" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-[180px]">
					<DropdownMenu.Group>
						<DropdownMenu.Item onclick={() => { yearFilter = 'all'; currentPage = 1; }} class="justify-between cursor-pointer {yearFilter === 'all' ? 'bg-accent text-accent-foreground' : ''}">
							All Years
							{#if yearFilter === 'all'}<CheckIcon class="size-4" />{/if}
						</DropdownMenu.Item>
						{#each availableYears as y (y)}
							<DropdownMenu.Item onclick={() => { yearFilter = y; currentPage = 1; }} class="justify-between cursor-pointer {yearFilter === y ? 'bg-accent text-accent-foreground' : ''}">
								{y}
								{#if yearFilter === y}<CheckIcon class="size-4" />{/if}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
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
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('employees')}>
								Employees
								{#if sortIcon('employees') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('employees') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="font-bold text-foreground text-[15px]">
							<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('uploaded_at')}>
								Uploaded On
								{#if sortIcon('uploaded_at') === 'asc'}<ArrowUpIcon class="ml-2 size-4" />
								{:else if sortIcon('uploaded_at') === 'desc'}<ArrowDownIcon class="ml-2 size-4" />
								{:else}<ArrowUpDownIcon class="ml-2 size-4" />{/if}
							</Button>
						</TableHead>
						<TableHead class="text-center font-bold text-foreground text-[15px]">Status</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								<LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
								Loading payroll uploads...
							</TableCell>
						</TableRow>
					{:else if filteredUploads.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-8 text-center text-muted-foreground">
								{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedUploads as u (u.cuid)}
							<TableRow
								onclick={(e) => {
									if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
									goto(resolve(`/payrolls/${u.cuid}`));
								}}
								class="cursor-pointer hover:bg-muted/70 transition-colors"
							>
								<TableCell class="font-medium">{monthName(u.month)}</TableCell>
								<TableCell>{u.year}</TableCell>
								<TableCell class="font-semibold tabular-nums">{u.employee_count}</TableCell>
								<TableCell class="text-muted-foreground">{formatDate(u.uploaded_at)}</TableCell>
								<TableCell class="text-center">
									<Badge variant={statusVariant(u.status)} class="capitalize">
										{statusLabel(u.status)}
									</Badge>
								</TableCell>
								<TableCell class="text-right w-24">
									<TableActions canEdit={false}>
										<DropdownMenu.Item onclick={() => goto(resolve(`/payrolls/${u.cuid}`))} class="cursor-pointer">
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
		<Pagination bind:currentPage pageSize={pageSize} totalItems={filteredUploads.length} />
	</div>
</div>
