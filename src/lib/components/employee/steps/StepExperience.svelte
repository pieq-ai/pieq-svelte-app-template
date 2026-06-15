<script lang="ts">
	import { Label, Input, DatePicker, Button } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { SvelteDate } from 'svelte/reactivity';
	import { onMount } from 'svelte';


	let { mode, cuid, onNext, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: (cuid?: string) => void, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let experiences = $state<{ company_name: string, role: string, description: string, from_date: string, to_date: string }[]>([]);

	function addExperience() {
		experiences = [...experiences, { company_name: '', role: '', description: '', from_date: '', to_date: '' }];
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/experiences`);
				const body = await res.json();
				if (res.ok && body.data) {
					experiences = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch experiences', e);
			}
		}
		if (experiences.length === 0 && mode !== 'view') {
			addExperience();
		}
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}
	function validateDates(from: string, to: string) {
		if (!from || !to) return 'Required';
		const dFrom = new SvelteDate(from);
		const dTo = new SvelteDate(to);
		if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) return "Invalid date.";
		if (dTo > new SvelteDate()) return "Cannot be a future date.";
		if (dFrom > dTo) return "From Date cannot be after To Date.";
		return '';
	}

	let hasErrors = $derived(
		experiences.some(e => 
			validateRequired(e.company_name) || 
			validateRequired(e.role) || 
			validateDates(e.from_date, e.to_date)
		)
	);

	async function save(shouldExit: boolean) {
		isTouched = true;
		if (hasErrors) {
			toast.error('Please correct the validation errors before saving.');
			return;
		}
		if (!cuid) return;

		try {
			isSubmitting = true;
			const res = await fetch(`/api/employees/${cuid}/experiences`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(experiences)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save experiences');
			}

			if (shouldExit) {
				window.location.href = '/employees';
			} else {
				onNext();
			}
		} catch (e: unknown) {
			toast.error((e as Error).message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6">
	{#if mode !== 'view'}
		<div class="flex justify-end">
			<Button variant="outline" size="sm" onclick={addExperience}>
				Add Experience
			</Button>
		</div>
	{/if}

	{#if experiences.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No experience records found.</p>
	{/if}

	{#each experiences as exp, index (index)}
		<div class="rounded-lg border border-border p-4 pt-10 relative">
			{#if mode !== 'view'}
				<Button variant="ghost" size="sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => experiences = experiences.filter((_, i) => i !== index)}>
					Delete
				</Button>
			{/if}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div class="space-y-2">
					<Label>Company Name <span class="text-destructive">*</span></Label>
					<Input bind:value={exp.company_name} placeholder="Company Name" class={(isTouched && validateRequired(exp.company_name)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(exp.company_name)}<p class="text-xs text-destructive">{validateRequired(exp.company_name)}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label>Role/Designation <span class="text-destructive">*</span></Label>
					<Input bind:value={exp.role} placeholder="e.g. Software Engineer" class={(isTouched && validateRequired(exp.role)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(exp.role)}<p class="text-xs text-destructive">{validateRequired(exp.role)}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label>From Date <span class="text-destructive">*</span></Label>
					<DatePicker bind:value={exp.from_date} class={(isTouched && validateDates(exp.from_date, exp.to_date)) ? 'border-destructive' : ''} disabled={mode === 'view'} />
				</div>
				<div class="space-y-2">
					<Label>To Date <span class="text-destructive">*</span></Label>
					<DatePicker bind:value={exp.to_date} class={(isTouched && validateDates(exp.from_date, exp.to_date)) ? 'border-destructive' : ''} disabled={mode === 'view'} />
					{#if isTouched && validateDates(exp.from_date, exp.to_date)}<p class="text-xs text-destructive">{validateDates(exp.from_date, exp.to_date)}</p>{/if}
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label>Description</Label>
					<Input bind:value={exp.description} placeholder="Key responsibilities and achievements..." readonly={mode === 'view'} />
				</div>
			</div>
		</div>
	{/each}

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting}>
			Previous
		</Button>
		<div class="space-x-2">
			{#if mode !== 'view'}
				<Button variant="outline" onclick={() => onNext()} disabled={isSubmitting}>
					Next
				</Button>
				<Button variant="secondary" onclick={() => save(true)} disabled={isSubmitting}>
					Save & Exit
				</Button>
				<Button onclick={() => save(false)} disabled={isSubmitting}>
					Save & Next
				</Button>
			{:else}
				<Button onclick={() => onNext()}>
					Next
				</Button>
			{/if}
		</div>
	</div>
</div>
