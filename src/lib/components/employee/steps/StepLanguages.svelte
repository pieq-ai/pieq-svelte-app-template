<script lang="ts">
	import { Button, MasterDataDropdown, SearchableDropdown } from '$lib/components';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';


	let { mode, cuid, onNext, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: (cuid?: string) => void, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let languages = $state<{ language_cuid: string, proficiency_level: string, can_read: boolean, can_write: boolean, can_speak: boolean }[]>([]);

	function addLanguage() {
		languages = [...languages, { language_cuid: '', proficiency_level: '', can_read: false, can_write: false, can_speak: false }];
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/languages`);
				const body = await res.json();
				if (res.ok && body.data) {
					languages = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch languages', e);
			}
		}
		if (languages.length === 0 && mode !== 'view') {
			addLanguage();
		}
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}

	let hasErrors = $derived(
		languages.some(l => 
			validateRequired(l.language_cuid) || 
			validateRequired(l.proficiency_level)
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
			const res = await fetch(`/api/employees/${cuid}/languages`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(languages)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save languages');
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
			<Button variant="outline" size="sm" onclick={addLanguage}>
				<PlusIcon class="mr-2 size-4" /> Add Language
			</Button>
		</div>
	{/if}

	{#if languages.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No languages recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each languages as lang, index (index)}
			<div class="flex flex-col gap-4 p-4 border border-border rounded-lg relative">
				{#if mode !== 'view'}
					<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => languages = languages.filter((_, i) => i !== index)}>
						<TrashIcon class="size-4" />
					</Button>
				{/if}
				<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full mt-4 sm:mt-0">
					<div class="flex-1 w-full sm:pr-8">
						<MasterDataDropdown 
							master="languages" 
							label="Language *" 
							value={lang.language_cuid} 
							onSelect={(val) => lang.language_cuid = val as string} 
							disabled={mode === 'view'}
							class={(isTouched && validateRequired(lang.language_cuid)) ? 'border-destructive' : ''}
						/>
					</div>
					<div class="flex-1 w-full">
						<SearchableDropdown 
							label="Proficiency *" 
							value={lang.proficiency_level} 
							options={[
								{ id: 'beginner', label: 'Beginner' },
								{ id: 'intermediate', label: 'Intermediate' },
								{ id: 'fluent', label: 'Fluent' }
							]}
							onSelect={(val) => lang.proficiency_level = val as string} 
							disabled={mode === 'view'}
							class={(isTouched && validateRequired(lang.proficiency_level)) ? 'border-destructive' : ''}
						/>
					</div>
				</div>
				<div class="flex gap-6 mt-2">
					<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" bind:checked={lang.can_read} disabled={mode === 'view'} /> Read</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" bind:checked={lang.can_write} disabled={mode === 'view'} /> Write</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" bind:checked={lang.can_speak} disabled={mode === 'view'} /> Speak</label>
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
