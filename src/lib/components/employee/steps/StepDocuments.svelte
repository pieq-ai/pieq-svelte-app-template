<script lang="ts">
	import { Label, Input, MasterDataDropdown, Button } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { isDuplicateEntry } from '$lib/utils/employeeValidationHelper';
	import { onMount } from 'svelte';

	let { mode, cuid, onNext, onPrev, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit';
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
		_id: string;            // stable local identity, never sent to server
		cuid?: string;
		document_type_cuid: string;
		file_name: string;
		mime_type: string;
		file_size: number;
		document_base64?: string | null;
		isReplacing?: boolean;
		// Backup for cancel — plain scalars only, no File
		_backupDocumentTypeCuid?: string;
		_backupFileName?: string;
		_backupMimeType?: string;
		_backupFileSize?: number;
		_backupBase64?: string | null;
	}

	// File objects live OUTSIDE $state to prevent Svelte 5 Proxy from wrapping Web API objects.
	// Keyed by the document item's stable _id.
	// Using a plain Record (not Map/SvelteMap) to keep this entirely non-reactive.
	const fileStore: Record<string, File> = {};

	let documents = $state<DocumentItem[]>([]);
	let originalData = $state('[]');

	function makeId(): string {
		return crypto.randomUUID();
	}

	function addDocument() {
		documents = [...documents, {
			_id: makeId(),
			document_type_cuid: '',
			file_name: '',
			mime_type: '',
			file_size: 0
		}];
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
					documents = (body.data as Omit<DocumentItem, '_id'>[]).map((d) => ({
						_id: makeId(),
						...d
					}));
				}
			} catch (e) {
				console.error('Failed to fetch documents', e);
			}
		}
		if (documents.length === 0) {
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
		const file = fileStore[doc._id];
		if (file) {
			previewOrDownload(file, doc.file_name, doc.mime_type);
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
			const payload = documents.map((doc) => {
				return {
					cuid: doc.cuid,
					document_type_cuid: doc.document_type_cuid,
					file_name: doc.file_name,
					mime_type: doc.mime_type,
					file_size: doc.file_size,
					// If document_base64 is undefined (existing doc, no new file picked),
					// send empty string so Zod's optionalString() pipeline receives the key.
					// The backend transforms '' → undefined, preserving the stored buffer.
					document_base64: doc.document_base64 !== undefined ? doc.document_base64 : ''
				};
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

			// Clear document_base64 from in-memory state after save to free memory
			documents = documents.map((d) => ({
				...d,
				document_base64: undefined,
				isReplacing: false,
				_backupDocumentTypeCuid: undefined,
				_backupFileName: undefined,
				_backupMimeType: undefined,
				_backupFileSize: undefined,
				_backupBase64: undefined
			}));
			// Keep fileStore as-is so View still works in the same session

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
		{#each documents as doc (doc._id)}
			{#if doc.file_name && !doc.isReplacing}
				<!-- Card View for Uploaded Document -->
				<div class="rounded-xl border border-border p-5 relative shadow-sm bg-card hover:shadow-md transition-shadow">
					<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
						<div class="flex items-start gap-4 w-full">
							<div class="flex items-center justify-center size-10 rounded-lg bg-[#F45310]/10 text-[#F45310] shrink-0 mt-1">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
							</div>
							<div class="space-y-3 w-full max-w-sm">
								<!-- Document Type (Readonly) -->
								<div class="pointer-events-none">
									<MasterDataDropdown 
										master="document-types" 
										label="Document Type" 
										value={doc.document_type_cuid} 
										onSelect={() => {}} 
										disabled={true}
									/>
								</div>
								<p class="text-sm font-medium text-muted-foreground truncate w-full" title={doc.file_name}>{doc.file_name}</p>
							</div>
						</div>
						<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap self-start">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							Uploaded Successfully
						</div>
					</div>

					<div class="flex items-center gap-2 pt-4 border-t border-border mt-4">
						<Button variant="ghost" size="sm" class="text-primary hover:bg-primary/10" onclick={() => handlePreview(doc)}>
							View
						</Button>
						{#if mode !== 'view'}
							<Button variant="ghost" size="sm" onclick={() => {
								// Backup only plain scalars — no File objects in reactive state
								doc._backupDocumentTypeCuid = doc.document_type_cuid;
								doc._backupFileName = doc.file_name;
								doc._backupMimeType = doc.mime_type;
								doc._backupFileSize = doc.file_size;
								doc._backupBase64 = doc.document_base64 ?? null;
								doc.isReplacing = true;
							}}>
								Replace
							</Button>
							<Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive/10 ml-auto" onclick={() => {
								delete fileStore[doc._id];
								documents = documents.filter((d) => d._id !== doc._id);
							}}>
								Delete
							</Button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Upload / Edit View -->
				<div class="rounded-lg border border-border p-4 relative bg-muted/20">
					<div class="flex justify-between items-center mb-4">
						<h4 class="text-sm font-semibold">{doc.isReplacing ? 'Replace Document' : 'New Document'}</h4>
						{#if mode !== 'view'}
							<div class="flex items-center gap-2">
								{#if doc.isReplacing}
									<Button variant="outline" size="sm" class="h-7 px-3 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
										disabled={isDuplicateEntry(documents, documents.indexOf(doc), x => x.document_type_cuid) || validateRequired(doc.document_type_cuid) !== ''}
										onclick={() => {
											doc.isReplacing = false;
										}}>
										Save
									</Button>
								{/if}
								<Button variant="ghost" size="sm" class="h-7 px-3 text-destructive hover:bg-destructive/10" onclick={() => {
									if (doc.isReplacing) {
										// Restore from scalar backup — no File objects needed
										doc.document_type_cuid = doc._backupDocumentTypeCuid ?? doc.document_type_cuid;
										doc.file_name = doc._backupFileName ?? doc.file_name;
										doc.mime_type = doc._backupMimeType ?? doc.mime_type;
										doc.file_size = doc._backupFileSize ?? doc.file_size;
										doc.document_base64 = doc._backupBase64 ?? doc.document_base64;
										// Restore File from fileStore if we had one before
										doc.isReplacing = false;
									} else {
										delete fileStore[doc._id];
										documents = documents.filter((d) => d._id !== doc._id);
									}
								}}>
									{doc.isReplacing ? 'Cancel' : 'Remove'}
								</Button>
							</div>
						{/if}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-2">
							<MasterDataDropdown 
								master="document-types" 
								label="Document Type *" 
								value={doc.document_type_cuid} 
								onSelect={(val) => doc.document_type_cuid = val as string} 
								disabled={mode === 'view'}
								exclude={documents.filter((d) => d._id !== doc._id && d.document_type_cuid).map(d => d.document_type_cuid)}
								class={(isTouched && (validateRequired(doc.document_type_cuid) || isDuplicateEntry(documents, documents.indexOf(doc), x => x.document_type_cuid))) ? 'border-destructive' : ''}
							/>
							{#if isTouched && isDuplicateEntry(documents, documents.indexOf(doc), x => x.document_type_cuid)}
								<p class="text-xs text-destructive mt-1">This entry already exists</p>
							{/if}
						</div>
						<div class="space-y-2">
							{#if mode !== 'view'}
								<Label>{doc.isReplacing ? 'Choose New File *' : 'File Upload *'}</Label>
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

										// Store File outside reactive state to avoid Svelte 5 Proxy issues
										fileStore[doc._id] = file;

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
								{#if doc.file_name && !doc.isReplacing}
									<p class="text-xs text-muted-foreground mt-1 text-right">Selected: {doc.file_name}</p>
								{/if}
							{:else}
								<Label>File Name</Label>
								<Input bind:value={doc.file_name} readonly />
							{/if}
						</div>
					</div>
				</div>
			{/if}
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
