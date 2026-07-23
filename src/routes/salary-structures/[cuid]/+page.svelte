<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
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
	let structure = $derived(data.structure);

	function isStructureActive(s: { status: boolean; effective_from: string; effective_to: string | null }) {
		const d = new Date();
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const todayStr = `${year}-${month}-${day}`;

		if (todayStr < s.effective_from) return false;
		if (s.effective_to !== null && todayStr > s.effective_to) return false;
		if (!s.status && s.effective_to === null) return false;
		return true;
	}

	// ─── Employee data ────────────────────────────────────────────────────────────

	interface MockEmployee {
		cuid: string;
		employee_id: string;
		name: string;
	}

	interface SalaryComponentRef {
		cuid: string;
		type: string;
	}

	let employeesList = $state<MockEmployee[]>([]);
	let employee = $derived(employeesList.find((e) => e.cuid === structure.employee_cuid) ?? null);
	let componentsList = $state<SalaryComponentRef[]>([]);

	// ─── Helpers ──────────────────────────────────────────────────────────────────

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '-';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			return `${parts[2]}/${parts[1]}/${parts[0]}`;
		}
		return dateStr;
	}

	function formatAmount(amount: number): string {
		return amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
	}

	function getComponentType(item: { salary_component_cuid: string; type?: string }): 'earning' | 'deduction' {
		if (item.type === 'deduction' || item.type === 'earning') {
			return item.type;
		}
		const comp = componentsList.find((c) => c.cuid === item.salary_component_cuid);
		if (comp && (comp.type === 'deduction' || comp.type === 'earning')) {
			return comp.type as 'earning' | 'deduction';
		}
		return 'earning';
	}

	let totalEarnings = $derived(
		structure.components
			.filter((item) => getComponentType(item) === 'earning')
			.reduce((sum, item) => sum + item.amount, 0)
	);

	let totalDeductions = $derived(
		structure.components
			.filter((item) => getComponentType(item) === 'deduction')
			.reduce((sum, item) => sum + item.amount, 0)
	);

	let totalSalary = $derived(totalEarnings - totalDeductions);

	// ─── Data loading ─────────────────────────────────────────────────────────────

	onMount(async () => {
		try {
			const [empRes, compRes] = await Promise.all([
				fetch('/api/salary-structures/employees'),
				fetch('/api/salary-components')
			]);
			if (empRes.ok) employeesList = (await empRes.json()).data ?? [];
			if (compRes.ok) componentsList = (await compRes.json()).data ?? [];
		} catch (err) {
			console.error('Failed to load reference data', err);
		}
	});
</script>

<svelte:head>
	<title>Salary Structure {employee?.name ?? structure.employee_cuid}</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Back navigation + actions -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex items-center gap-3">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="h-9 w-9 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/salary-structures'))}
				aria-label="Back to Salary Structures"
			>
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div class="space-y-0.5">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Salary Structure</h1>
			</div>
		</div>

	</div>

	<!-- Header card -->
	<Card>
		<CardContent>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Employee -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Employee</p>
					{#if employee}
						<p class="font-semibold text-foreground">{employee.name}</p>
						<p class="text-sm text-muted-foreground">{employee.employee_id}</p>
					{:else}
						<p class="font-semibold text-foreground">{structure.employee_cuid}</p>
					{/if}
				</div>

				<!-- Effective From -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Effective From</p>
					<p class="font-semibold text-foreground">{formatDate(structure.effective_from)}</p>
				</div>

				<!-- Effective To -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Effective To</p>
					<p class="font-semibold text-foreground">{formatDate(structure.effective_to)}</p>
				</div>

				<!-- Status -->
				<div class="space-y-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Status</p>
					<Badge variant={isStructureActive(structure) ? 'default' : 'secondary'}>
						{isStructureActive(structure) ? 'Active' : 'Inactive'}
					</Badge>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Components table -->
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Salary Components</h2>
		<Card class="py-0">
			<Table>
				<TableHeader class="bg-muted">
					<TableRow>
						<TableHead class="font-bold text-foreground text-[15px]">Component</TableHead>
						<TableHead class="text-right font-bold text-foreground text-[15px]">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if structure.components.length === 0}
						<TableRow>
							<TableCell colspan={2} class="py-8 text-center text-muted-foreground">
								No components assigned.
							</TableCell>
						</TableRow>
					{:else}
						{#each structure.components as item (item.cuid)}
							<TableRow>
								<TableCell class="font-medium">{item.component_name_snapshot}</TableCell>
								<TableCell class="text-right font-mono text-sm">
									{formatAmount(item.amount)}
								</TableCell>
							</TableRow>
						{/each}
						<!-- Total row -->
						<TableRow class="border-t-2 bg-muted/40">
							<TableCell class="font-bold text-foreground">Total</TableCell>
							<TableCell class="text-right font-mono font-bold text-foreground">
								{formatAmount(totalSalary)}
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</Card>
	</div>
</div>
