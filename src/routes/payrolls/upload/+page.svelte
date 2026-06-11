<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';

	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';

	import {
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components';

	import type { PayrollUploadError } from '$lib/types/payroll';

	// ─── Upload state ─────────────────────────────────────────────────────────────

	let selectedFile = $state<File | null>(null);
	let isUploading = $state(false);
	let dragOver = $state(false);

	// ─── Pay Period state ─────────────────────────────────────────────────────────

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1; // 1-indexed

	let uploadMonth = $state(currentMonth);
	let uploadYear = $state(currentYear);

	const monthOptions = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

	// ─── Result state ─────────────────────────────────────────────────────────────

	interface UploadResult {
		created: number;
		skipped: number;
		errors: PayrollUploadError[];
		warnings?: string[];
	}

	let uploadResult = $state<UploadResult | null>(null);
	let uploadError = $state('');

	// ─── File selection ───────────────────────────────────────────────────────────

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		selectFile(file);
	}

	function selectFile(file: File | null) {
		uploadError = '';
		uploadResult = null;

		if (!file) {
			selectedFile = null;
			return;
		}

		if (!/\.(xlsx|xls)$/i.test(file.name)) {
			uploadError = `Invalid file type: "${file.name}". Only .xlsx and .xls files are accepted.`;
			selectedFile = null;
			return;
		}

		selectedFile = file;
	}

	// ─── Drag and drop ────────────────────────────────────────────────────────────

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0] ?? null;
		selectFile(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	// ─── Upload ───────────────────────────────────────────────────────────────────

	async function handleUpload() {
		if (!selectedFile) return;

		isUploading = true;
		uploadError = '';
		uploadResult = null;

		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('month', String(uploadMonth));
		formData.append('year', String(uploadYear));

		try {
			const res = await fetch('/api/payrolls/upload', {
				method: 'POST',
				body: formData
			});

			const resData = await res.json();

			if (res.ok && resData.data) {
				uploadResult = resData.data;
				if (resData.data.created > 0) {
					toast.success(`${resData.data.created} payroll record(s) uploaded successfully.`);
				} else {
					toast.error('No records were created. Check the error details below.');
				}
			} else {
				uploadError = resData.message || 'Upload failed. Please try again.';
				toast.error(uploadError);
			}
		} catch (err) {
			uploadError = 'An unexpected error occurred. Please try again.';
			toast.error(uploadError);
			console.error(err);
		} finally {
			isUploading = false;
		}
	}

	function resetUpload() {
		selectedFile = null;
		uploadResult = null;
		uploadError = '';
	}

	// ─── File size helper ─────────────────────────────────────────────────────────

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>HRMS — Upload Payroll</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Page header -->
	<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex items-center gap-3">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="h-9 w-9 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/payrolls'))}
				aria-label="Back to Payroll"
			>
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div class="space-y-0.5">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Upload Payroll</h1>
				<p class="text-sm text-muted-foreground">Upload an Excel file to create payroll records.</p>
			</div>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Upload card -->
		<Card>
			<CardHeader>
				<CardTitle>Select File</CardTitle>
				<CardDescription>
					Upload a payroll spreadsheet (.xlsx or .xls). One record will be created per employee per month.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<!-- Pay Period Selectors -->
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="pay_month" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pay Month</label>
						<select
							id="pay_month"
							bind:value={uploadMonth}
							class="flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each monthOptions as opt (opt.value)}
								<option value={opt.value} class="bg-background text-foreground">{opt.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<label for="pay_year" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pay Year</label>
						<select
							id="pay_year"
							bind:value={uploadYear}
							class="flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each yearOptions as yr (yr)}
								<option value={yr} class="bg-background text-foreground">{yr}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Drop zone -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors {dragOver
						? 'border-[#F45310] bg-[#F45310]/5'
						: 'border-border bg-muted/20 hover:border-[#F45310]/50 hover:bg-muted/40'}"
					ondrop={handleDrop}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
				>
					<FileSpreadsheetIcon class="mx-auto mb-3 size-10 text-muted-foreground" />
					<p class="text-sm font-medium text-foreground">Drag & drop your Excel file here</p>
					<p class="mt-1 text-xs text-muted-foreground">or click to browse</p>
					<p class="mt-2 text-xs text-muted-foreground">Accepts .xlsx and .xls files</p>
					<!-- Hidden file input overlay -->
					<input
						id="payroll_file_input"
						type="file"
						accept=".xlsx,.xls"
						class="absolute inset-0 cursor-pointer opacity-0"
						onchange={handleFileChange}
						aria-label="Select payroll Excel file"
					/>
				</div>

				<!-- Selected file info -->
				{#if selectedFile}
					<div class="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
						<div class="flex items-center gap-2 min-w-0">
							<FileSpreadsheetIcon class="size-4 shrink-0 text-[#F45310]" />
							<span class="text-sm font-medium truncate">{selectedFile.name}</span>
							<span class="text-xs text-muted-foreground shrink-0">({formatSize(selectedFile.size)})</span>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="h-7 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
							onclick={resetUpload}
						>
							Remove
						</Button>
					</div>
				{/if}

				<!-- Frontend error -->
				{#if uploadError}
					<p class="text-xs rounded bg-destructive/10 px-3 py-2" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">
						{uploadError}
					</p>
				{/if}

				<!-- Action buttons -->
				<div class="flex items-center gap-3">
					<Button
						type="button"
						class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-0 flex-1"
						disabled={!selectedFile || isUploading}
						onclick={handleUpload}
					>
						{#if isUploading}
							<LoaderCircleIcon class="mr-2 size-4 animate-spin" />
							Uploading...
						{:else}
							<UploadIcon class="mr-2 size-4" />
							Upload Payroll
						{/if}
					</Button>
					{#if uploadResult}
						<Button
							type="button"
							variant="outline"
							onclick={() => goto(resolve('/payrolls'))}
						>
							View Records
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Instructions card -->
		<Card>
			<CardHeader>
				<CardTitle>Excel Format Guide</CardTitle>
				<CardDescription>Ensure your spreadsheet follows this format.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 text-sm">
				<div class="space-y-2">
					<p class="font-medium text-foreground">Required columns:</p>
					<ul class="space-y-1 text-muted-foreground">
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Emp No</span> — Employee code (e.g. EMP001)</li>
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Month</span> — "June", "Jun", 6, or "06"</li>
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Year</span> — 4-digit year (e.g. 2026)</li>
					</ul>
				</div>
				<div class="space-y-2">
					<p class="font-medium text-foreground">Optional summary columns:</p>
					<ul class="space-y-1 text-muted-foreground">
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Gross Earnings</span></li>
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Total Deduction</span></li>
						<li><span class="font-mono text-xs bg-muted px-1 py-0.5 rounded">Net Salary</span></li>
					</ul>
				</div>
				<div class="space-y-2">
					<p class="font-medium text-foreground">Component columns:</p>
					<p class="text-muted-foreground">All other numeric columns (Basic, HRA, PF, etc.) are stored as payroll components automatically.</p>
				</div>
				<div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
					<p class="text-xs text-amber-800 dark:text-amber-200">
						<strong>Note:</strong> If an employee code is not found, that row will be skipped and reported in the upload summary. All other rows continue processing.
					</p>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Upload result -->
	{#if uploadResult}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">Upload Summary</h2>

			<!-- Stats -->
			<div class="grid gap-4 sm:grid-cols-3">
				<Card class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
					<CardContent class="pt-4">
						<div class="flex items-center gap-3">
							<CheckCircleIcon class="size-8 text-green-600 dark:text-green-400" />
							<div>
								<p class="text-2xl font-bold text-green-700 dark:text-green-400">{uploadResult.created}</p>
								<p class="text-sm text-green-600 dark:text-green-500">Records Created</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card class="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
					<CardContent class="pt-4">
						<div class="flex items-center gap-3">
							<AlertTriangleIcon class="size-8 text-amber-600 dark:text-amber-400" />
							<div>
								<p class="text-2xl font-bold text-amber-700 dark:text-amber-400">{uploadResult.skipped}</p>
								<p class="text-sm text-amber-600 dark:text-amber-500">Rows Skipped</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card class="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
					<CardContent class="pt-4">
						<div class="flex items-center gap-3">
							<XCircleIcon class="size-8 text-red-600 dark:text-red-400" />
							<div>
								<p class="text-2xl font-bold text-red-700 dark:text-red-400">{uploadResult.errors.length}</p>
								<p class="text-sm text-red-600 dark:text-red-500">Errors</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Error detail list -->
			{#if uploadResult.errors.length > 0}
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-base">Error Details</CardTitle>
						<CardDescription>The following rows could not be processed.</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each uploadResult.errors as err (err.row)}
								<div class="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
									<XCircleIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
									<div class="min-w-0 text-sm">
										<span class="font-medium text-foreground">Row {err.row}</span>
										{#if err.employee_code && err.employee_code !== '(empty)'}
											<span class="text-muted-foreground"> · {err.employee_code}</span>
										{/if}
										<p class="text-muted-foreground">{err.reason}</p>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Warnings -->
			{#if uploadResult.warnings && uploadResult.warnings.length > 0}
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-base">Warnings</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#each uploadResult.warnings as warning (warning)}
								<div class="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2">
									<AlertTriangleIcon class="mt-0.5 size-4 shrink-0 text-amber-600" />
									<p class="text-sm text-amber-800">{warning}</p>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	{/if}
</div>
