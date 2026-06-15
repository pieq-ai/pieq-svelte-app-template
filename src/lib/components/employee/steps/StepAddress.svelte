<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, Button } from '$lib/components';
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

	type AddressItem = { address_type: string; door_no: string; address_line1: string; address_line2: string; city: string; state_cuid: string; country_cuid: string; pin_code: string };

	const emptyAddress = (): AddressItem => ({ address_type: 'communication', door_no: '', address_line1: '', address_line2: '', city: '', state_cuid: '', country_cuid: '', pin_code: '' });

	let addresses = $state<AddressItem[]>([]);
	let originalData = $state('[]');

	function addAddress() {
		addresses = [...addresses, emptyAddress()];
	}

	function normalizeAddressItem(item: Partial<AddressItem>): AddressItem {
		return {
			address_type: item.address_type || 'communication',
			door_no: item.door_no || '',
			address_line1: item.address_line1 || '',
			address_line2: item.address_line2 || '',
			city: item.city || '',
			state_cuid: item.state_cuid || '',
			country_cuid: item.country_cuid || '',
			pin_code: item.pin_code || ''
		};
	}
	function normalizeAddresses(list: Partial<AddressItem>[]): AddressItem[] {
		return (list || []).map(normalizeAddressItem);
	}

	onMount(async () => {
		if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/addresses`);
				const body = await res.json();
				if (res.ok && body.data) {
					addresses = body.data;
				}
			} catch (e) {
				console.error('Failed to fetch addresses', e);
			}
		}
		if (addresses.length === 0 && mode !== 'view') {
			addAddress();
		}
		originalData = JSON.stringify(normalizeAddresses(addresses));
		onRegisterSaveOnly?.(saveOnly);
	});

	let isDirty = $derived(JSON.stringify(normalizeAddresses(addresses)) !== originalData);

	$effect(() => {
		onDirtyChange?.(isDirty);
	});

	// Validations
	function validateRequired(val: string | undefined | null) {
		return val && val.trim().length > 0 ? '' : 'Required';
	}
	function validatePinCode(val: string | undefined | null) {
		if (!val) return 'Required';
		if (!/^[0-9]{6}$/.test(val)) return 'Must be 6 digits';
		return '';
	}

	let hasErrors = $derived(
		addresses.some(a =>
			validateRequired(a.address_type) ||
			validateRequired(a.address_line1) ||
			validateRequired(a.city) ||
			validateRequired(a.state_cuid) ||
			validateRequired(a.country_cuid) ||
			validatePinCode(a.pin_code)
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
			const res = await fetch(`/api/employees/${cuid}/addresses`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(addresses)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.data?.message || body.error || 'Failed to save addresses');
			}
			originalData = JSON.stringify(normalizeAddresses(addresses));
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

<div class="space-y-6">
	{#if mode !== 'view'}
		<div class="flex justify-end">
			<Button variant="outline" size="sm" onclick={addAddress}>
				Add Address
			</Button>
		</div>
	{/if}

	{#if addresses.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No address records found.</p>
	{/if}

	{#each addresses as address, index (index)}
		<div class="rounded-lg border border-border p-4 pt-10 relative">
			{#if mode !== 'view'}
				<Button variant="ghost" size="sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => addresses = addresses.filter((_, i) => i !== index)}>
					Delete
				</Button>
			{/if}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
				<SearchableDropdown
					label="Address Type *"
					value={address.address_type}
					options={[
						{ id: 'communication', label: 'Communication' },
						{ id: 'permanent', label: 'Permanent' }
					]}
					onSelect={(val) => address.address_type = val as string}
					disabled={mode === 'view'}
					class={(isTouched && validateRequired(address.address_type)) ? 'border-destructive' : ''}
				/>
				<div class="space-y-2">
					<Label>Door No</Label>
					<Input bind:value={address.door_no} placeholder="Flat/Door No" readonly={mode === 'view'} />
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>Address Line 1 <span class="text-destructive">*</span></Label>
					<Input bind:value={address.address_line1} placeholder="123 Main St" class={(isTouched && validateRequired(address.address_line1)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(address.address_line1)}<p class="text-xs text-destructive">{validateRequired(address.address_line1)}</p>{/if}
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>Address Line 2</Label>
					<Input bind:value={address.address_line2} placeholder="Landmark/Area" readonly={mode === 'view'} />
				</div>
				<div class="space-y-2">
					<Label>City <span class="text-destructive">*</span></Label>
					<Input bind:value={address.city} placeholder="City Name" class={(isTouched && validateRequired(address.city)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validateRequired(address.city)}<p class="text-xs text-destructive">{validateRequired(address.city)}</p>{/if}
				</div>
				<MasterDataDropdown
					master="countries"
					label="Country *"
					value={address.country_cuid}
					onSelect={(val) => address.country_cuid = val as string}
					disabled={mode === 'view'}
					class={(isTouched && validateRequired(address.country_cuid)) ? 'border-destructive' : ''}
				/>
				<MasterDataDropdown
					master="states"
					label="State *"
					value={address.state_cuid}
					onSelect={(val) => address.state_cuid = val as string}
					disabled={mode === 'view'}
					class={(isTouched && validateRequired(address.state_cuid)) ? 'border-destructive' : ''}
				/>
				<div class="space-y-2">
					<Label>Pin Code <span class="text-destructive">*</span></Label>
					<Input bind:value={address.pin_code} placeholder="123456" class={(isTouched && validatePinCode(address.pin_code)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={mode === 'view'} />
					{#if isTouched && validatePinCode(address.pin_code)}<p class="text-xs text-destructive">{validatePinCode(address.pin_code)}</p>{/if}
				</div>
			</div>
		</div>
	{/each}

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
