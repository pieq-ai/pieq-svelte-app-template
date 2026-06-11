<script lang="ts">
	import { Label, Input, SearchableDropdown, DatePicker, Button } from '$lib/components';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { SvelteDate } from 'svelte/reactivity';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { mode, cuid, onNext, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: () => void, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let educations = $state<{ education_level: string, specialization: string, institution: string, university_board: string, percentage: string, completed_at: string }[]>([]);

	function addEducation() {
		educations = [...educations, { education_level: '', specialization: '', institution: '', university_board: '', percentage: '', completed_at: '' }];
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/educations`);
				const body = await res.json();
				if (res.ok && body.data) {
					educations = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch educations', e);
			}
		}
		if (educations.length === 0 && mode !== 'view') {
			addEducation();
		}
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}
	function validatePercentage(val: string | undefined | null) {
		if (!val) return 'Required';
		const num = parseFloat(val);
		if (isNaN(num) || num < 0 || num > 100) return 'Must be 0-100';
		return '';
	}
	function validatePastDate(date: string) {
		if (!date) return 'Required';
		const dt = new SvelteDate(date);
		if (isNaN(dt.getTime())) return "Invalid date.";
		if (dt > new SvelteDate()) return "Cannot be a future date.";
		return '';
	}

	let hasErrors = $derived(
		educations.some(e => 
			validateRequired(e.education_level) || 
			validateRequired(e.specialization) || 
			validateRequired(e.institution) || 
			validateRequired(e.university_board) || 
			validatePercentage(e.percentage?.toString()) || 
			validatePastDate(e.completed_at)
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
			const res = await fetch(`/api/employees/${cuid}/educations`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(educations)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save educations');
			}

			if (shouldExit) {
				await goto('/employees');
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
			<Button variant="outline" size="sm" onclick={addEducation}>
				<PlusIcon class="mr-2 size-4" /> Add Education
			</Button>
		</div>
	{/if}

	{#if educations.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No education records found.</p>
	{/if}

	{#each educations as edu, index (index)}
		<div class="rounded-lg border border-border p-4 pt-10 relative">
			{#if mode !== 'view'}
				<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => educations = educations.filter((_, i) => i !== index)}>
					<TrashIcon class="size-4" />
				</Button>
			{/if}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
				<SearchableDropdown 
					label="Education Level *" 
					value={edu.education_level} 
					options={[
						{ id: '10th', label: '10th Standard' },
						{ id: '12th', label: '12th Standard' },
						{ id: 'diploma', label: 'Diploma' },
						{ id: 'bachelors', label: 'Bachelors Degree' },
						{ id: 'masters', label: 'Masters Degree' },
						{ id: 'doctorate', label: 'Doctorate (Ph.D)' }
					]}
					onSelect={(val) => edu.education_level = val as string} 
					disabled={mode === 'view'}
					class={(isTouched && validateRequired(edu.education_level)) ? 'border-destructive' : ''}
				/>
				<div class="space-y-2">
					<Label>Specialization/Major <span class="text-destructive">*</span></Label>
					<Input bind:value={edu.specialization} placeholder="e.g. Computer Science" class={(isTouched && validateRequired(edu.specialization)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(edu.specialization)}<p class="text-xs text-destructive">{validateRequired(edu.specialization)}</p>{/if}
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>Institution/School <span class="text-destructive">*</span></Label>
					<Input bind:value={edu.institution} placeholder="Institution Name" class={(isTouched && validateRequired(edu.institution)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(edu.institution)}<p class="text-xs text-destructive">{validateRequired(edu.institution)}</p>{/if}
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>University/Board <span class="text-destructive">*</span></Label>
					<Input bind:value={edu.university_board} placeholder="University/Board Name" class={(isTouched && validateRequired(edu.university_board)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(edu.university_board)}<p class="text-xs text-destructive">{validateRequired(edu.university_board)}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label>Percentage/CGPA <span class="text-destructive">*</span></Label>
					<Input type="number" step="0.01" bind:value={edu.percentage} placeholder="e.g. 85.5" class={(isTouched && validatePercentage(edu.percentage?.toString())) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validatePercentage(edu.percentage?.toString())}<p class="text-xs text-destructive">{validatePercentage(edu.percentage?.toString())}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label>Completion Date <span class="text-destructive">*</span></Label>
					<DatePicker bind:value={edu.completed_at} class={(isTouched && validatePastDate(edu.completed_at)) ? 'border-destructive' : ''} disabled={mode === 'view'} />
					{#if isTouched && validatePastDate(edu.completed_at)}<p class="text-xs text-destructive">{validatePastDate(edu.completed_at)}</p>{/if}
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
