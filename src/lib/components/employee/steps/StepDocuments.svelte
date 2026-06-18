<script lang="ts">
	import { Label, Input, MasterDataDropdown, Button } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { isDuplicateEntry } from '$lib/utils/employeeValidationHelper';
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
	let readingCount = $state(0);

	interface DocumentItem {
		cuid?: string;
		document_type_cuid: string;
		file_name: string;
		mime_type: string;
		file_size: number;
		document_base64?: string | null;
		file?: File;
	}

	let documents = $state<DocumentItem[]>([]);
	let originalData = $state('[]');

	function addDocument() {
		documents = [...documents, { document_type_cuid: '', file_name: '', mime_type: '', file_size: 0 }];
	}

	function normalizeDocItem(item: Partial<DocumentItem>) {
		return {
			document_type_cuid: item.document_type_cuid || '',
			file_name: item.file_name || '',
			mime_type: item.mime_type || '',
			file_size: item.file_size || 0
		};
	}
	function normalizeDocs(list: Partial<DocumentItem>[]) {
		return (list || []).map(normalizeDocItem);
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/documents`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
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
		originalData = JSON.stringify(normalizeDocs(documents));
	});

	let isDirty = $derived(
		JSON.stringify(normalizeDocs(documents)) !== originalData
	);

	$effect(() => {
		onDirtyChange?.(isDirty);
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}

	let hasErrors = $derived(
		documents.some((d, i) => 
			validateRequired(d.document_type_cuid) || 
			validateRequired(d.file_name) ||
			isDuplicateEntry(documents, i, x => x.document_type_cuid)
		)
	);

	function previewOrDownload(blob: Blob, fileName: string, mimeType: string) {
		const objectUrl = URL.createObjectURL(blob);
		const lowerMime = (mimeType || '').toLowerCase();
		
		if (lowerMime === 'application/pdf' || lowerMime.startsWith('image/')) {
			const newTab = window.open();
			if (newTab) {
				newTab.location.href = objectUrl;
			} else {
				window.location.href = objectUrl;
			}
		} else {
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
		
		setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
	}

	async function handlePreview(doc: DocumentItem) {
		if (doc.file) {
			previewOrDownload(doc.file, doc.file_name, doc.mime_type);
			return;
		}
		if (doc.cuid && cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/documents/${doc.cuid}`);
				if (!res.ok) throw new Error('Failed to retrieve document content');
				const blob = await res.blob();
				previewOrDownload(blob, doc.file_name, doc.mime_type);
			} catch (e) {
				toast.error((e as Error).message);
			}
		}
	}

	async function saveOnly(): Promise<{ success: boolean }> {
		isTouched = true;
		if (hasErrors) {
			return { success: false };
		}
		if (!cuid) return { success: false };

		try {
			isSubmitting = true;
			// Strip local File objects for JSON payload
			const payload = documents.map((doc) => {
				const docCopy = { ...doc };
				delete docCopy.file;
				return docCopy;
			});
			const res = await fetch(`/api/employees/${cuid}/documents`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.data?.message || body.error || 'Failed to save documents');
			}

			originalData = JSON.stringify(normalizeDocs(documents));
			toast.success('Updated successfully');
			return { success: true };
		} catch (e: unknown) {
			toast.error((e as Error).message);
			return { success: false };
		} finally {
			isSubmitting = false;
		}
	}

	async function save() {
		const result = await saveOnly();
		if (!result.success) return;
		onNext();
	}
</script>

<div class="space-y-4">
	{#if mode !== 'view'}
		<div class="flex justify-end">
			<Button variant="outline" size="sm" onclick={addDocument} disabled={isSubmitting || readingCount > 0}>
				Add Document
			</Button>
		</div>
	{/if}

	{#if documents.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No documents recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each documents as doc, index (index)}
			<div class="rounded-lg border border-border p-4 relative">
				{#if doc.file_name || mode !== 'view'}
					<div class="flex justify-end gap-1 mb-2">
						{#if doc.file_name}
							<Button variant="ghost" size="sm" class="h-7 px-2 text-primary hover:bg-primary/10" onclick={() => handlePreview(doc)} title="Preview Document">
								View
							</Button>
						{/if}
						{#if mode !== 'view'}
							<Button variant="ghost" size="sm" class="h-7 px-2 text-destructive hover:bg-destructive/10" onclick={() => documents = documents.filter((_, i) => i !== index)} title="Delete Document">
								Delete
							</Button>
						{/if}
					</div>
				{/if}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-2">
						<MasterDataDropdown 
							master="document-types" 
							label="Document Type *" 
							value={doc.document_type_cuid} 
							onSelect={(val) => doc.document_type_cuid = val as string} 
							disabled={mode === 'view'}
							class={(isTouched && (validateRequired(doc.document_type_cuid) || isDuplicateEntry(documents, index, x => x.document_type_cuid))) ? 'border-destructive' : ''}
						/>
						{#if isTouched && isDuplicateEntry(documents, index, x => x.document_type_cuid)}
							<p class="text-xs text-destructive mt-1">This entry already exists</p>
						{/if}
					</div>
					<div class="space-y-2">
						{#if mode !== 'view'}
							<Label>File Upload <span class="text-destructive">*</span></Label>
							<Input type="file" accept=".pdf,application/pdf" onchange={(e) => {
								const file = e.currentTarget.files?.[0];
								if (file) {
									if (file.type !== 'application/pdf') {
										toast.error('Only PDF files are allowed');
										e.currentTarget.value = '';
										return;
									}
									if (file.size > 2 * 1024 * 1024) {
										toast.error('PDF file size must not exceed 2 MB.');
										e.currentTarget.value = '';
										return;
									}
									doc.file_name = file.name;
									doc.mime_type = file.type;
									doc.file_size = file.size;
									doc.file = file;

									readingCount++;
									const reader = new FileReader();
									reader.onload = () => {
										doc.document_base64 = reader.result as string;
										readingCount--;
									};
									reader.onerror = () => {
										readingCount--;
										toast.error('Failed to read file contents');
									};
									reader.readAsDataURL(file);
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
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting || readingCount > 0}>
			Previous
		</Button>
		<div class="space-x-2">
			{#if mode !== 'view'}
				<Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save()} disabled={isSubmitting}>
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
