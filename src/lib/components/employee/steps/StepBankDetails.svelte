<script lang="ts">
	import { Label, Input, Button } from '$lib/components';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';


	let { mode, cuid, onPrev } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onPrev: () => void }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let bankDetails = $state<{ account_holder_name: string, account_number: string, bank_name: string, branch_name: string, ifsc_code: string, is_primary: boolean }[]>([]);

	function addBank() {
		bankDetails = [...bankDetails, { account_holder_name: '', account_number: '', bank_name: '', branch_name: '', ifsc_code: '', is_primary: false }];
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

	async function save() {
		isTouched = true;
		if (hasErrors) {
			toast.error('Please correct the validation errors before saving.');
			return;
		}
		if (!cuid) return;

		try {
			isSubmitting = true;
			const res = await fetch(`/api/employees/${cuid}/bank-details`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bankDetails)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save bank details');
			}

			toast.success(mode === 'create' ? 'Employee created successfully!' : 'Employee updated successfully!');
			window.location.href = '/employees';
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
			<Button variant="outline" size="sm" onclick={addBank}>
				<PlusIcon class="mr-2 size-4" /> Add Bank
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
					<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => bankDetails = bankDetails.filter((_, i) => i !== index)}>
						<TrashIcon class="size-4" />
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
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting}>
			Previous
		</Button>
		<div class="space-x-2">
			{#if mode !== 'view'}
				<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save()} disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Submit / Complete'}
				</Button>
			{:else}
				<Button onclick={async () => window.location.href = '/employees'}>
					Finish
				</Button>
			{/if}
		</div>
	</div>
</div>
