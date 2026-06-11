<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	import {
		Badge,
		Button,
		Card,
		CardContent,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components';

	// ─── Props ────────────────────────────────────────────────────────────────────

	let { data } = $props();
	let payroll = $derived(data.payroll);

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

	// ─── Breakdown display ────────────────────────────────────────────────────────

	let breakdownEntries = $derived(
		Object.entries(payroll.payroll_breakdown).sort(([, a], [, b]) => b - a)
	);
</script>

<svelte:head>
	<title>Payslip — {payroll.employee_name} — {monthName(payroll.month)} {payroll.year}</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Back navigation -->
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
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Payroll Detail</h1>
				<p class="text-sm text-muted-foreground">{monthName(payroll.month)} {payroll.year}</p>
			</div>
		</div>
		<Badge variant="outline" class="w-fit text-sm">
			Uploaded {formatDate(payroll.uploaded_at)}
		</Badge>
	</div>

	<!-- Employee header card -->
	<Card>
		<CardContent>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Employee Name -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Employee</p>
					<p class="font-semibold text-foreground">{payroll.employee_name}</p>
					<p class="text-sm text-muted-foreground">{payroll.employee_code}</p>
				</div>

				<!-- Month -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Month</p>
					<p class="font-semibold text-foreground">{monthName(payroll.month)}</p>
				</div>

				<!-- Year -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Year</p>
					<p class="font-semibold text-foreground">{payroll.year}</p>
				</div>

				<!-- Net Salary -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Net Salary</p>
					<p class="font-bold text-xl text-[#F45310]">₹{formatAmount(payroll.net_salary)}</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Payroll Breakdown table -->
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Payroll Components</h2>
		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">Component</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px]">Amount (₹)</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if breakdownEntries.length === 0}
						<TableRow>
							<TableCell colspan={2} class="py-8 text-center text-muted-foreground">
								No component breakdown available.
							</TableCell>
						</TableRow>
					{:else}
						{#each breakdownEntries as [component, amount] (component)}
							<TableRow>
								<TableCell class="font-medium">{component}</TableCell>
								<TableCell class="text-right font-mono text-sm">{formatAmount(amount)}</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
	</div>

	<!-- Summary card -->
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Summary</h2>
		<Card class="py-0">
			<Table>
				<TableBody>
					<TableRow>
						<TableCell class="font-medium text-muted-foreground">Gross Earnings</TableCell>
						<TableCell class="text-right font-mono font-semibold">₹{formatAmount(payroll.gross_earnings)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell class="font-medium text-muted-foreground">Total Deduction</TableCell>
						<TableCell class="text-right font-mono font-semibold text-destructive">₹{formatAmount(payroll.total_deduction)}</TableCell>
					</TableRow>
					<TableRow class="border-t-2 bg-muted/40">
						<TableCell class="font-bold text-foreground text-base">Net Salary</TableCell>
						<TableCell class="text-right font-mono font-bold text-[#F45310] text-base">₹{formatAmount(payroll.net_salary)}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</Card>
	</div>
</div>
