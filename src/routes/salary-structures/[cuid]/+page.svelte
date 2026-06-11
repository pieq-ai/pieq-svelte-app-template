<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	import { toast } from '$lib/toast';
	import { createDirtyChecker } from '$lib/utils';
	import { UI_CONSTANTS } from '$lib/constants';
	import { validateEffectiveFrom, validateAmount } from '$lib/validators/salary-structure';

	import {
		Badge,
		Button,
		Card,
		CardContent,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		DatePicker,
		CrudModal
	} from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { SalaryComponentDto } from '$lib/server/serializers/salary-component.serializer';

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

	let employeesList = $state<MockEmployee[]>([]);
	let componentsList = $state<SalaryComponentDto[]>([]);

	let employee = $derived(employeesList.find((e) => e.cuid === structure.employee_cuid) ?? null);

	// ─── Revision modal state ─────────────────────────────────────────────────────

	let isRevisionOpen = $state(false);
	let isSubmitting = $state(false);
	let backendError = $state('');

	interface RevisionItem {
		id: number;
		salary_component_cuid: string;
		amount: string;
	}

	let revisionEffectiveFrom = $state<string | null>('');
	let revisionItems = $state<RevisionItem[]>([]);
	let nextItemId = $state(0);
	let fieldErrors = $state<Record<string, string>>({});

	interface RevisionDirtySnapshot {
		effective_from: string | null;
		components: string;
	}

	const dirtyChecker = createDirtyChecker<RevisionDirtySnapshot>();

	let isRevisionDirty = $derived(
		isRevisionOpen &&
			dirtyChecker.isDirty({
				effective_from: revisionEffectiveFrom,
				components: JSON.stringify(
					revisionItems.map((i) => ({
						salary_component_cuid: i.salary_component_cuid,
						amount: i.amount
					}))
				)
			})
	);

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

	// ─── Data loading ─────────────────────────────────────────────────────────────

	onMount(async () => {
		try {
			const [empRes, compRes] = await Promise.all([
				fetch('/api/salary-structures/employees'),
				fetch('/api/salary-structures/components')
			]);
			if (empRes.ok) employeesList = (await empRes.json()).data ?? [];
			if (compRes.ok) componentsList = (await compRes.json()).data ?? [];
		} catch (err) {
			console.error('Failed to load reference data', err);
		}
	});

	// ─── Revision modal helpers ───────────────────────────────────────────────────

	function openRevision() {
		backendError = '';
		fieldErrors = {};
		revisionEffectiveFrom = '';
		// Pre-fill from current structure
		revisionItems = structure.components.map((c) => ({
			id: nextItemId++,
			salary_component_cuid: c.salary_component_cuid,
			amount: String(c.amount)
		}));
		dirtyChecker.snapshot({
			effective_from: '',
			components: JSON.stringify(
				structure.components.map((c) => ({
					salary_component_cuid: c.salary_component_cuid,
					amount: String(c.amount)
				}))
			)
		});
		isRevisionOpen = true;
	}

	function closeRevision() {
		isRevisionOpen = false;
	}

	function addRevisionItem() {
		revisionItems = [...revisionItems, { id: nextItemId++, salary_component_cuid: '', amount: '' }];
	}

	function removeRevisionItem(id: number) {
		revisionItems = revisionItems.filter((i) => i.id !== id);
	}

	function getUsedComponentCuids(excludeId: number): Set<string> {
		return new Set(
			revisionItems
				.filter((i) => i.id !== excludeId && i.salary_component_cuid)
				.map((i) => i.salary_component_cuid)
		);
	}

	/** Only show Active components in the dropdown (inactive ones cannot be newly assigned). */
	let activeComponents = $derived(componentsList.filter((c) => c.status));

	function validateRevisionForm(): boolean {
		const errors: Record<string, string> = {};

		const efError = validateEffectiveFrom(revisionEffectiveFrom);
		if (efError) errors['effective_from'] = efError;

		if (revisionItems.length === 0) {
			errors['components'] = 'At least one component is required';
		}

		const seenCuids = new SvelteSet<string>();
		revisionItems.forEach((item, i) => {
			if (!item.salary_component_cuid) {
				errors[`items[${i}].salary_component_cuid`] = 'Component is required';
			} else if (seenCuids.has(item.salary_component_cuid)) {
				errors[`items[${i}].salary_component_cuid`] = 'Duplicate component';
			} else {
				seenCuids.add(item.salary_component_cuid);
			}

			const amountNum = parseFloat(item.amount);
			const amtError = validateAmount(isNaN(amountNum) ? undefined : amountNum);
			if (item.amount === '') {
				errors[`items[${i}].amount`] = 'Amount is required';
			} else if (amtError) {
				errors[`items[${i}].amount`] = amtError;
			}
		});

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleRevisionSubmit(e: Event) {
		e.preventDefault();
		if (!validateRevisionForm()) return;

		isSubmitting = true;
		backendError = '';

		const payload = {
			effective_from: revisionEffectiveFrom,
			components: revisionItems.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
				amount: parseFloat(item.amount)
			}))
		};

		try {
			const res = await fetch(`/api/salary-structures/${structure.cuid}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const resData = await res.json();

			if (res.ok && resData.data) {
				toast.success('Salary revision created successfully');
				closeRevision();
				// Navigate to the new revision's detail page
				goto(resolve(`/salary-structures/${resData.data.cuid}`));
			} else {
				if (res.status === 400 || res.status === 409) {
					backendError = resData.message || resData.error || 'Validation failed';
				} else {
					toast.error(resData.message || resData.error || 'Failed to create revision.');
				}
			}
		} catch (err) {
			toast.error('An error occurred. Please try again.');
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Salary Structure — {employee?.name ?? structure.employee_cuid}</title>
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

		{#if structure.status}
			<Button
				type="button"
				class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0"
				onclick={openRevision}
			>
				Create Revision
			</Button>
		{/if}
	</div>

	<!-- Header card -->
	<Card>
		<CardContent>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
								{formatAmount(structure.components.reduce((sum, c) => sum + c.amount, 0))}
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</Card>
	</div>
</div>

<!-- ─── Create Revision Modal ──────────────────────────────────────────────── -->

<CrudModal
	open={isRevisionOpen}
	title="Create Revision"
	description="A new Active structure will be created. The current structure will be marked Inactive."
	isDirty={isRevisionDirty}
	isSubmitting={isSubmitting}
	onClose={closeRevision}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={handleRevisionSubmit}>
			<!-- New Effective From -->
			<div class="space-y-2">
				<Label for="revision_effective_from">New Effective From</Label>
				<DatePicker
					id="revision_effective_from"
					name="revision_effective_from"
					bind:value={revisionEffectiveFrom}
					class={fieldErrors['effective_from'] ? 'border-destructive' : ''}
					onChange={() => { delete fieldErrors['effective_from']; fieldErrors = { ...fieldErrors }; }}
				/>
				{#if fieldErrors['effective_from']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['effective_from']}</p>
				{/if}
			</div>

			<!-- Component items -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>Salary Components</Label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="h-7 gap-1 text-xs"
						onclick={addRevisionItem}
					>
						<PlusIcon class="size-3" /> Add Component
					</Button>
				</div>

				{#if fieldErrors['components']}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors['components']}</p>
				{/if}

				<div class="space-y-2 rounded-lg border bg-muted/20 p-3">
					{#if revisionItems.length === 0}
						<p class="text-sm text-muted-foreground text-center py-2">No components added yet.</p>
					{/if}

					{#each revisionItems as item (item.id)}
						{@const usedCuids = getUsedComponentCuids(item.id)}
						{@const itemIndex = revisionItems.findIndex((i) => i.id === item.id)}
						<div class="flex items-start gap-2">
							<!-- Component selector -->
							<div class="flex-1 space-y-1">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												variant="outline"
												class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {fieldErrors[`items[${itemIndex}].salary_component_cuid`] ? 'border-destructive' : ''}"
												{...props}
											>
												{item.salary_component_cuid
													? (activeComponents.find((c) => c.cuid === item.salary_component_cuid)?.component_name
														?? componentsList.find((c) => c.cuid === item.salary_component_cuid)?.component_name
														?? item.salary_component_cuid)
													: 'Select component...'}
												<ChevronDownIcon class="ml-2 size-4 opacity-50" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content class="w-[220px] max-h-60 overflow-y-auto">
										<DropdownMenu.Group>
											{#each activeComponents as comp (comp.cuid)}
												<DropdownMenu.Item
													onclick={() => {
														item.salary_component_cuid = comp.cuid;
														delete fieldErrors[`items[${itemIndex}].salary_component_cuid`];
														fieldErrors = { ...fieldErrors };
													}}
													disabled={usedCuids.has(comp.cuid)}
													class="justify-between cursor-pointer {item.salary_component_cuid === comp.cuid ? 'bg-accent text-accent-foreground' : ''} {usedCuids.has(comp.cuid) ? 'opacity-40 cursor-not-allowed' : ''}"
												>
													<span class="truncate">{comp.component_name}</span>
													{#if item.salary_component_cuid === comp.cuid}<CheckIcon class="size-4 shrink-0" />{/if}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
								{#if fieldErrors[`items[${itemIndex}].salary_component_cuid`]}
									<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors[`items[${itemIndex}].salary_component_cuid`]}</p>
								{/if}
							</div>

							<!-- Amount input -->
							<div class="w-32 space-y-1">
								<Input
									type="number"
									min="0"
									step="0.01"
									placeholder="Amount"
									bind:value={item.amount}
									class="h-9 {fieldErrors[`items[${itemIndex}].amount`] ? 'border-destructive focus-visible:ring-destructive/30' : ''}"
									oninput={() => {
										delete fieldErrors[`items[${itemIndex}].amount`];
										fieldErrors = { ...fieldErrors };
									}}
								/>
								{#if fieldErrors[`items[${itemIndex}].amount`]}
									<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{fieldErrors[`items[${itemIndex}].amount`]}</p>
								{/if}
							</div>

							<!-- Remove button -->
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								class="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
								onclick={() => removeRevisionItem(item.id)}
								aria-label="Remove component"
								disabled={revisionItems.length <= 1}
							>
								<TrashIcon class="size-4" />
							</Button>
						</div>
					{/each}
				</div>
			</div>

			{#if backendError}
				<p class="text-xs rounded bg-destructive/10 px-3 py-2" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{backendError}</p>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>
					{UI_CONSTANTS.BUTTON_CANCEL}
				</Button>
				<Button
					type="submit"
					class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<LoaderCircleIcon class="mr-2 size-4 animate-spin" />
						Creating...
					{:else}
						Create Revision
					{/if}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
