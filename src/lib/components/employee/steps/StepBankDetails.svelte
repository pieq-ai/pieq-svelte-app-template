<script lang="ts">
	import { Label, Input, Button, CrudModal } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import {
		validatePersonal,
		validateEmployment,
		validateAddresses,
		validateEducations,
		validateExperiences,
		validateSkills,
		validateLanguages,
		validateDocuments,
		validateBankDetails
	} from '$lib/utils/employeeValidationHelper';

	let { mode, cuid, onPrev, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit' | 'view';
		cuid: string | null;
		onPrev: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onCancel: () => void;
	}>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);
	let isValidating = $state(false);
	let showValidationModal = $state(false);
	let validationErrors = $state<{ section: string; errors: string[] }[]>([]);

	interface BankDetailsItem {
		account_holder_name: string;
		account_number: string;
		bank_name: string;
		branch_name: string;
		ifsc_code: string;
		is_primary: boolean;
	}

	let bankDetails = $state<BankDetailsItem[]>([]);
	let originalData = $state('[]');

	function addBank() {
		bankDetails = [...bankDetails, { account_holder_name: '', account_number: '', bank_name: '', branch_name: '', ifsc_code: '', is_primary: false }];
	}

	function normalizeBankItem(item: Partial<BankDetailsItem>) {
		return {
			account_holder_name: item.account_holder_name || '',
			account_number: item.account_number || '',
			bank_name: item.bank_name || '',
			branch_name: item.branch_name || '',
			ifsc_code: (item.ifsc_code || '').toUpperCase().trim(),
			is_primary: !!item.is_primary
		};
	}
	function normalizeBankDetails(list: Partial<BankDetailsItem>[]) {
		return (list || []).map(normalizeBankItem);
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/bank-details`);
				const body = await res.json();
				if (res.ok && body.data) {
					bankDetails = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch bank details', e);
			}
		}
		if (bankDetails.length === 0 && mode !== 'view') {
			addBank();
		}
		originalData = JSON.stringify(normalizeBankDetails(bankDetails));
	});

	let isDirty = $derived(JSON.stringify(normalizeBankDetails(bankDetails)) !== originalData);

	$effect(() => {
		onDirtyChange?.(isDirty);
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}
	function validateIfsc(val: string | undefined | null) {
		if (!val) return 'Required';
		if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val)) return 'Invalid IFSC (e.g. SBIN0123456)';
		return '';
	}

	let hasErrors = $derived(
		bankDetails.some(b => 
			validateRequired(b.account_holder_name) || 
			validateRequired(b.account_number) || 
			validateRequired(b.bank_name) || 
			validateIfsc(b.ifsc_code)
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
			const res = await fetch(`/api/employees/${cuid}/bank-details`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bankDetails)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.data?.message || body.error || 'Failed to save bank details');
			}

			originalData = JSON.stringify(normalizeBankDetails(bankDetails));
			return { success: true };
		} catch (e: unknown) {
			toast.error((e as Error).message);
			return { success: false };
		} finally {
			isSubmitting = false;
		}
	}

	async function save(shouldExit: boolean = false): Promise<boolean> {
		const result = await saveOnly();
		if (!result.success) return false;
		if (shouldExit) {
			toast.success('Draft saved successfully!');
			window.location.href = '/employees';
		}
		return true;
	}

	async function handleSubmit() {
		isTouched = true;
		if (hasErrors) {
			return;
		}
		if (!cuid) return;

		try {
			isValidating = true;
			// 1. Fetch data for sections 1-8
			const [
				resPersonal,
				resEmployment,
				resAddresses,
				resEducations,
				resExperiences,
				resSkills,
				resLanguages,
				resDocuments
			] = await Promise.all([
				fetch(`/api/employees/${cuid}`),
				fetch(`/api/employees/${cuid}/employment`),
				fetch(`/api/employees/${cuid}/addresses`),
				fetch(`/api/employees/${cuid}/educations`),
				fetch(`/api/employees/${cuid}/experiences`),
				fetch(`/api/employees/${cuid}/skills`),
				fetch(`/api/employees/${cuid}/languages`),
				fetch(`/api/employees/${cuid}/documents`)
			]);

			const personalData = resPersonal.ok ? (await resPersonal.json()).data : {};
			const employmentData = resEmployment.ok ? (await resEmployment.json()).data : {};
			const addressesData = resAddresses.ok ? (await resAddresses.json()).data : [];
			const educationsData = resEducations.ok ? (await resEducations.json()).data : [];
			const experiencesData = resExperiences.ok ? (await resExperiences.json()).data : [];
			const skillsData = resSkills.ok ? (await resSkills.json()).data : [];
			const languagesData = resLanguages.ok ? (await resLanguages.json()).data : [];
			const documentsData = resDocuments.ok ? (await resDocuments.json()).data : [];

			// 2. Validate all sections
			const errorsList: { section: string; errors: string[] }[] = [];

			const errPersonal = validatePersonal(personalData || {});
			if (errPersonal.length > 0) errorsList.push({ section: 'Personal Details', errors: errPersonal });

			const errEmployment = validateEmployment(employmentData || {});
			if (errEmployment.length > 0) errorsList.push({ section: 'Employment Details', errors: errEmployment });

			const errAddresses = validateAddresses(addressesData || []);
			if (errAddresses.length > 0) errorsList.push({ section: 'Address Details', errors: errAddresses });

			const errEducations = validateEducations(educationsData || []);
			if (errEducations.length > 0) errorsList.push({ section: 'Education Details', errors: errEducations });

			const errExperiences = validateExperiences(experiencesData || []);
			if (errExperiences.length > 0) errorsList.push({ section: 'Experience Details', errors: errExperiences });

			const errSkills = validateSkills(skillsData || []);
			if (errSkills.length > 0) errorsList.push({ section: 'Skills Details', errors: errSkills });

			const errLanguages = validateLanguages(languagesData || []);
			if (errLanguages.length > 0) errorsList.push({ section: 'Languages Details', errors: errLanguages });

			const errDocuments = validateDocuments(documentsData || []);
			if (errDocuments.length > 0) errorsList.push({ section: 'Documents Details', errors: errDocuments });

			const errBankDetails = validateBankDetails(bankDetails || []);
			if (errBankDetails.length > 0) errorsList.push({ section: 'Bank Details', errors: errBankDetails });

			if (errorsList.length > 0) {
				validationErrors = errorsList;
				showValidationModal = true;
				return;
			}

			// 3. If everything is valid:
			// Save Step 9
			const ok = await saveOnly();
			if (!ok.success) return;

			// Complete profile_completion_status to completed
			const resComplete = await fetch(`/api/employees/${cuid}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ profile_completion_status: 'completed' })
			});

			if (!resComplete.ok) {
				const body = await resComplete.json();
				throw new Error(body.data?.message || body.error || 'Failed to complete employee profile status');
			}

			toast.success('Employee profile completed successfully!');
			window.location.href = '/employees';

		} catch (e: unknown) {
			toast.error((e as Error).message);
		} finally {
			isValidating = false;
		}
	}

	async function saveDraftAndExit() {
		try {
			const ok = await saveOnly();
			if (ok.success) {
				toast.success('Progress saved as draft.');
				window.location.href = '/employees';
			}
		} catch {
			// error already toasted in saveOnly()
		}
	}
</script>

<div class="space-y-4">
	{#if mode !== 'view'}
		<div class="flex justify-end">
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={addBank} disabled={isSubmitting}>
				Add Bank
			</Button>
		</div>
	{/if}

	{#if bankDetails.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No bank details recorded.</p>
	{/if}

	<div class="space-y-4">
		{#each bankDetails as bank, index (index)}
			<div class="rounded-lg border border-border p-4 pt-10 relative">
				{#if mode !== 'view'}
					<Button variant="ghost" size="sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => bankDetails = bankDetails.filter((_, i) => i !== index)}>
						Delete
					</Button>
				{/if}
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label>Bank Name <span class="text-destructive">*</span></Label>
						<Input bind:value={bank.bank_name} placeholder="e.g. Chase Bank" class={(isTouched && validateRequired(bank.bank_name)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} required />
						{#if isTouched && validateRequired(bank.bank_name)}<p class="text-xs text-destructive">{validateRequired(bank.bank_name)}</p>{/if}
					</div>
					<div class="space-y-2">
						<Label>Branch Name</Label>
						<Input bind:value={bank.branch_name} placeholder="Downtown Branch" readonly={mode === 'view'} />
					</div>
					<div class="space-y-2">
						<Label>Account Holder Name <span class="text-destructive">*</span></Label>
						<Input bind:value={bank.account_holder_name} placeholder="John Doe" class={(isTouched && validateRequired(bank.account_holder_name)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} required />
						{#if isTouched && validateRequired(bank.account_holder_name)}<p class="text-xs text-destructive">{validateRequired(bank.account_holder_name)}</p>{/if}
					</div>
					<div class="space-y-2">
						<Label>Account Number <span class="text-destructive">*</span></Label>
						<Input bind:value={bank.account_number} placeholder="000123456789" class={(isTouched && validateRequired(bank.account_number)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} required />
						{#if isTouched && validateRequired(bank.account_number)}<p class="text-xs text-destructive">{validateRequired(bank.account_number)}</p>{/if}
					</div>
					<div class="space-y-2">
						<Label>Routing / IFSC Code <span class="text-destructive">*</span></Label>
						<Input bind:value={bank.ifsc_code} oninput={(e) => bank.ifsc_code = e.currentTarget.value.toUpperCase()} placeholder="IFSC/Routing" class={(isTouched && validateIfsc(bank.ifsc_code)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} required />
						{#if isTouched && validateIfsc(bank.ifsc_code)}<p class="text-xs text-destructive">{validateIfsc(bank.ifsc_code)}</p>{/if}
					</div>
					<div class="space-y-2 flex items-end pb-2">
						<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" bind:checked={bank.is_primary} disabled={mode === 'view'} /> Primary Account</label>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting || isValidating}>
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
				
			{/if}
		</div>
	</div>
</div>

{#if showValidationModal}
	<CrudModal open={showValidationModal} title="Incomplete Employee Profile" onClose={() => showValidationModal = false}>
		<div class="space-y-4">
			<p class="text-sm text-muted-foreground">The profile cannot be marked as completed because some mandatory details are missing. You can return to the form to complete them, or save your progress as a draft and exit.</p>
			
			<div class="space-y-3 max-h-[40vh] overflow-y-auto border border-border rounded-lg p-4 bg-muted/20">
				{#each validationErrors as sectionError (sectionError.section)}
					<div class="space-y-1">
						<h4 class="text-sm font-semibold text-foreground">{sectionError.section}</h4>
						<ul class="list-disc pl-5 text-xs text-destructive space-y-1">
							{#each sectionError.errors as err (err)}
								<li>{err}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<div class="flex justify-end gap-2 pt-2 border-t border-border">
				<Button type="button" variant="outline" onclick={() => showValidationModal = false}>Return to Form</Button>
				<Button type="button" variant="secondary" onclick={saveDraftAndExit} disabled={isSubmitting}>Save as Draft & Exit</Button>
			</div>
		</div>
	</CrudModal>
{/if}
