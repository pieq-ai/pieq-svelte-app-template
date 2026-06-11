<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, Button } from '$lib/components';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { mode, cuid, onNext, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: (cuid?: string) => void, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let skills = $state<{ skill_cuid: string, proficiency_level: string, years_of_experience: string }[]>([]);

	function addSkill() {
		skills = [...skills, { skill_cuid: '', proficiency_level: '', years_of_experience: '' }];
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/skills`);
				const body = await res.json();
				if (res.ok && body.data) {
					skills = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch skills', e);
			}
		}
		if (skills.length === 0 && mode !== 'view') {
			addSkill();
		}
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}

	let hasErrors = $derived(
		skills.some(s => 
			validateRequired(s.skill_cuid) || 
			validateRequired(s.proficiency_level)
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
			const res = await fetch(`/api/employees/${cuid}/skills`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(skills)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save skills');
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
			<Button variant="outline" size="sm" onclick={addSkill}>
				<PlusIcon class="mr-2 size-4" /> Add Skill
			</Button>
		</div>
	{/if}

	{#if skills.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No skills recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each skills as skill, index (index)}
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-lg border border-border p-4 relative">
				{#if mode !== 'view'}
					<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 sm:static sm:order-last text-destructive hover:bg-destructive/10" onclick={() => skills = skills.filter((_, i) => i !== index)}>
						<TrashIcon class="size-4" />
					</Button>
				{/if}
				<div class="flex-1 w-full mt-4 sm:mt-0">
					<MasterDataDropdown 
						master="skills" 
						label="Skill *" 
						value={skill.skill_cuid} 
						onSelect={(val) => skill.skill_cuid = val as string} 
						disabled={mode === 'view'}
						class={(isTouched && validateRequired(skill.skill_cuid)) ? 'border-destructive' : ''}
					/>
				</div>
				<div class="flex-1 w-full">
					<SearchableDropdown 
						label="Proficiency *" 
						value={skill.proficiency_level} 
						options={[
							{ id: 'beginner', label: 'Beginner' },
							{ id: 'intermediate', label: 'Intermediate' },
							{ id: 'expert', label: 'Expert' }
						]}
						onSelect={(val) => skill.proficiency_level = val as string} 
						disabled={mode === 'view'}
						class={(isTouched && validateRequired(skill.proficiency_level)) ? 'border-destructive' : ''}
					/>
				</div>
				<div class="space-y-2 w-full sm:w-32">
					<Label>Years of Exp</Label>
					<Input type="number" step="0.1" bind:value={skill.years_of_experience} placeholder="0.0" readonly={mode === 'view'} />
				</div>
			</div>
		{/each}
	</div>

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
