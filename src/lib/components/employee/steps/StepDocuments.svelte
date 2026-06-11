<script lang="ts">
	import { Label, Input, MasterDataDropdown, Button } from '$lib/components';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';


	let { mode, cuid, onNext, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: (cuid?: string) => void, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let documents = $state<{ document_type_cuid: string, file_name: string, mime_type: string, file_size: number }[]>([]);

	function addDocument() {
		documents = [...documents, { document_type_cuid: '', file_name: '', mime_type: '', file_size: 0 }];
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/documents`);
				const body = await res.json();
				if (res.ok && body.data) {
					documents = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch documents', e);
			}
		}
		if (documents.length === 0 && mode !== 'view') {
			addDocument();
		}
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}

	let hasErrors = $derived(
		documents.some(d => 
			validateRequired(d.document_type_cuid) || 
			validateRequired(d.file_name)
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
			const res = await fetch(`/api/employees/${cuid}/documents`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(documents)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save documents');
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
			<Button variant="outline" size="sm" onclick={addDocument}>
				<PlusIcon class="mr-2 size-4" /> Add Document
			</Button>
		</div>
	{/if}

	{#if documents.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No documents recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each documents as doc, index (index)}
			<div class="rounded-lg border border-border p-4 pt-10 relative">
				{#if mode !== 'view'}
					<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => documents = documents.filter((_, i) => i !== index)}>
						<TrashIcon class="size-4" />
					</Button>
				{/if}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<MasterDataDropdown 
						master="document-types" 
						label="Document Type *" 
						value={doc.document_type_cuid} 
						onSelect={(val) => doc.document_type_cuid = val as string} 
						disabled={mode === 'view'}
						class={(isTouched && validateRequired(doc.document_type_cuid)) ? 'border-destructive' : ''}
					/>
					<div class="space-y-2">
						{#if mode !== 'view'}
							<Label>File Upload <span class="text-destructive">*</span></Label>
							<Input type="file" onchange={(e) => {
								const file = e.currentTarget.files?.[0];
								if (file) {
									doc.file_name = file.name;
									doc.mime_type = file.type;
									doc.file_size = file.size;
								}
							}} class={(isTouched && validateRequired(doc.file_name)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
							{#if doc.file_name}
								<p class="text-xs text-muted-foreground mt-1 text-right">Selected: {doc.file_name}</p>
							{/if}
						{:else}
							<Label>File Name</Label>
							<Input bind:value={doc.file_name} readonly />
						{/if}
					</div>
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
