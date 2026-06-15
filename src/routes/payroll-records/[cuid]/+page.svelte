<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	import {
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

	function goToPayslip() {
		goto(resolve(`/payroll-records/${payroll.cuid}/payslip`));
	}

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

	// ─── Breakdown split ──────────────────────────────────────────────────────────
	// The breakdown JSON is flat {component: amount}. We display all entries in a
	// single "Components" table, then show the explicit gross/deduction/net summary.

	function isMeaningful(value: unknown): boolean {
		if (value === null || value === undefined) return false;
		if (value === 0 || value === 0.0) return false;
		const str = String(value).trim();
		if (str === '' || str === '-' || str === '0' || str === '0.00') return false;
		return true;
	}

	let breakdownEntries = $derived(
		Object.entries(payroll.payroll_breakdown)
			.filter(([, v]) => isMeaningful(v))
			.sort(([, a], [, b]) => b - a)
	);

	// Separate earnings (positive) and deductions (negative or zero with known name)
	let earnings = $derived(breakdownEntries.filter(([, v]) => v > 0));
	let deductions = $derived(breakdownEntries.filter(([, v]) => v < 0));

	// Back navigation — prefer upload batch if available
	function goBack() {
		if (payroll.payroll_upload_cuid) {
			goto(resolve(`/payrolls/${payroll.payroll_upload_cuid}`));
		} else {
			goto(resolve('/payrolls'));
		}
	}
</script>

<svelte:head>
	<title>Payslip — {payroll.employee_name} — {monthName(payroll.month)} {payroll.year}</title>
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
				onclick={goBack}
				aria-label="Back"
			>
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div class="space-y-0.5">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Payroll Record Details</h1>
				<p class="text-sm text-muted-foreground">{monthName(payroll.month)} {payroll.year}</p>
			</div>
		</div>

		<!-- Payslip actions -->
		<div class="flex items-center gap-2">
			<Button
				id="btn_view_payslip"
				type="button"
				variant="default"
				class="gap-2 bg-[#F45310] text-white hover:bg-[#d4430a]"
				onclick={goToPayslip}
				aria-label="View Payslip"
			>
				View Payslip
			</Button>
		</div>
	</div>

	<!-- Employee Information -->
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Employee Information</h2>
		<Card>
			<CardContent>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<div class="space-y-1">
						<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Employee Name</p>
						<p class="font-semibold text-foreground">{payroll.employee_name}</p>
					</div>
					<div class="space-y-1">
						<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Employee Code</p>
						<p class="font-mono font-semibold text-foreground">{payroll.employee_code}</p>
					</div>
					<div class="space-y-1">
						<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Month</p>
						<p class="font-semibold text-foreground">{monthName(payroll.month)}</p>
					</div>
					<div class="space-y-1">
						<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Year</p>
						<p class="font-semibold text-foreground">{payroll.year}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Earnings -->
	{#if earnings.length > 0}
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Earnings</h2>
			<Card class="py-0">
				<Table>
					<TableHeader class="bg-muted">
						<TableRow>
							<TableHead class="font-bold text-foreground text-[15px]">Component</TableHead>
							<TableHead class="text-right font-bold text-foreground text-[15px]">Amount (₹)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each earnings as [component, amount] (component)}
							<TableRow>
								<TableCell class="font-medium">{component}</TableCell>
								<TableCell class="text-right font-mono text-sm">{formatAmount(amount)}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</Card>
		</div>
	{/if}

	<!-- Deductions -->
	{#if deductions.length > 0}
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Deductions</h2>
			<Card class="py-0">
				<Table>
					<TableHeader class="bg-muted">
						<TableRow>
							<TableHead class="font-bold text-foreground text-[15px]">Component</TableHead>
							<TableHead class="text-right font-bold text-foreground text-[15px]">Amount (₹)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each deductions as [component, amount] (component)}
							<TableRow>
								<TableCell class="font-medium">{component}</TableCell>
								<TableCell class="text-right font-mono text-sm text-destructive">{formatAmount(Math.abs(amount))}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</Card>
		</div>
	{/if}

	<!-- Fallback: all components if none split -->
	{#if earnings.length === 0 && deductions.length === 0}
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
						<TableRow>
							<TableCell colspan={2} class="py-8 text-center text-muted-foreground">
								No component breakdown available.
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Card>
		</div>
	{/if}

	<!-- Summary -->
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
