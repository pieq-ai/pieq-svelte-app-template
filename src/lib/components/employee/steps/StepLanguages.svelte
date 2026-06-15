<script lang="ts">
	import { Button, MasterDataDropdown, SearchableDropdown } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	type SaveOnlyFn = () => Promise<{ success: boolean; cuid?: string }>;

	let { mode, cuid, onNext, onPrev, onDirtyChange, onRegisterSaveOnly } = $props<{
		mode: 'create' | 'edit' | 'view';
		cuid: string | null;
		onNext: (cuid?: string) => void;
		onPrev: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onRegisterSaveOnly?: (fn: SaveOnlyFn) => void;
	}>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	type LangItem = {
		language_cuid: string;
		proficiency_level: string;
		can_read: boolean;
		can_write: boolean;
		can_speak: boolean;
	};
	const emptyLang = (): LangItem => ({
		language_cuid: '',
		proficiency_level: '',
		can_read: false,
		can_write: false,
		can_speak: false
	});

	let languages = $state<LangItem[]>([]);
	let originalData = $state('[]');

	function addLanguage() {
		languages = [...languages, emptyLang()];
	}

	function normalizeLangItem(item: Partial<LangItem>): LangItem {
		return {
			language_cuid: item.language_cuid || '',
			proficiency_level: item.proficiency_level || '',
			can_read: item.can_read ?? false,
			can_write: item.can_write ?? false,
			can_speak: item.can_speak ?? false
		};
	}
	function normalizeLanguages(list: Partial<LangItem>[]): LangItem[] {
		return (list || []).map(normalizeLangItem);
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
		originalData = JSON.stringify(normalizeLanguages(languages));
		onRegisterSaveOnly?.(saveOnly);
	});

	let isDirty = $derived(JSON.stringify(normalizeLanguages(languages)) !== originalData);

	$effect(() => {
		onDirtyChange?.(isDirty);
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

	async function saveOnly(): Promise<{ success: boolean }> {
		isTouched = true;
		if (hasErrors) {
			toast.error('Please correct the validation errors before saving.');
			return { success: false };
		}
		if (!cuid) return { success: false };

		try {
			isSubmitting = true;
			const res = await fetch(`/api/employees/${cuid}/languages`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(languages)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.data?.message || body.error || 'Failed to save languages');
			}
			originalData = JSON.stringify(normalizeLanguages(languages));
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
			<Button variant="outline" size="sm" onclick={addLanguage}>
				Add Language
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
					<Button variant="ghost" size="sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => languages = languages.filter((_, i) => i !== index)}>
						Delete
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
						{#if isTouched && validateRequired(lang.language_cuid)}<p class="text-xs text-destructive mt-1">{validateRequired(lang.language_cuid)}</p>{/if}
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
						{#if isTouched && validateRequired(lang.proficiency_level)}<p class="text-xs text-destructive mt-1">{validateRequired(lang.proficiency_level)}</p>{/if}
					</div>
				</div>
				<div class="flex gap-4 mt-2">
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
