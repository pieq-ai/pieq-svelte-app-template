<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, Button } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let { mode, cuid, onNext, onPrev, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit' | 'view';
		cuid: string | null;
		onNext: (cuid?: string) => void;
		onPrev: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onCancel: () => void;
	}>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	type SkillItem = { skill_cuid: string; proficiency_level: string; years_of_experience: string };
	const emptySkill = (): SkillItem => ({ skill_cuid: '', proficiency_level: '', years_of_experience: '' });

	let skills = $state<SkillItem[]>([]);
	let originalData = $state('[]');

	function addSkill() {
		skills = [...skills, emptySkill()];
	}

	function normalizeSkillItem(item: Partial<SkillItem>): SkillItem {
		return {
			skill_cuid: item.skill_cuid || '',
			proficiency_level: item.proficiency_level || '',
			years_of_experience: item.years_of_experience != null ? String(item.years_of_experience).trim() : ''
		};
	}
	function normalizeSkills(list: Partial<SkillItem>[]): SkillItem[] {
		return (list || []).map(normalizeSkillItem);
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
		originalData = JSON.stringify(normalizeSkills(skills));
	});

	let isDirty = $derived(JSON.stringify(normalizeSkills(skills)) !== originalData);

	$effect(() => {
		onDirtyChange?.(isDirty);
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

	async function saveOnly(): Promise<{ success: boolean }> {
		isTouched = true;
		if (hasErrors) {
			return { success: false };
		}
		if (!cuid) return { success: false };

		try {
			isSubmitting = true;
			const res = await fetch(`/api/employees/${cuid}/skills`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(skills)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.data?.message || body.error || 'Failed to save skills');
			}
			originalData = JSON.stringify(normalizeSkills(skills));
			return { success: true };
		} catch (e: unknown) {
			toast.error((e as Error).message);
			return { success: false };
		} finally {
			isSubmitting = false;
		}
	}

	async function save(shouldExit: boolean) {
		const result = await saveOnly();
		if (!result.success) return;
		if (shouldExit) {
			window.location.href = '/employees';
		} else {
			onNext();
		}
	}
</script>

<div class="space-y-4">
	{#if mode !== 'view'}
		<div class="flex justify-end">
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={addSkill} disabled={isSubmitting}>
				Add Skill
			</Button>
		</div>
	{/if}

	{#if skills.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No skills recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each skills as skill, index (index)}
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-lg border border-border p-4">
				{#if mode !== 'view'}
					<Button variant="ghost" size="sm" class="sm:order-last text-destructive hover:bg-destructive/10 h-8 self-end sm:self-auto" onclick={() => skills = skills.filter((_, i) => i !== index)}>
						Delete
					</Button>
				{/if}
				<div class="flex-1 w-full">
					<MasterDataDropdown
						master="skills"
						label="Skill *"
						value={skill.skill_cuid}
						onSelect={(val) => skill.skill_cuid = val as string}
						disabled={mode === 'view'}
						class={(isTouched && validateRequired(skill.skill_cuid)) ? 'border-destructive' : ''}
					/>
					{#if isTouched && validateRequired(skill.skill_cuid)}<p class="text-xs text-destructive mt-1">{validateRequired(skill.skill_cuid)}</p>{/if}
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
					{#if isTouched && validateRequired(skill.proficiency_level)}<p class="text-xs text-destructive mt-1">{validateRequired(skill.proficiency_level)}</p>{/if}
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
				<Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save(false)} disabled={isSubmitting}>
					Save
				</Button>
			{:else}
				<Button onclick={() => onNext()}>
					Next
				</Button>
			{/if}
		</div>
	</div>
</div>
