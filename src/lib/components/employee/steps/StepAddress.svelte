<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, Button } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { onMount, untrack } from 'svelte';

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

	type AddressItem = { address_type: string; door_no: string; address_line1: string; address_line2: string; city: string; state_cuid: string; country_cuid: string; pin_code: string };

	const emptyAddress = (): AddressItem => ({ address_type: 'communication', door_no: '', address_line1: '', address_line2: '', city: '', state_cuid: '', country_cuid: '', pin_code: '' });

	let addresses = $state<AddressItem[]>([]);
	let originalData = $state('[]');

	let isPermSameAsComm = $state(false);

	function addAddress() {
		if (addresses.length >= 2) {
			toast.error('You can only add a maximum of 2 addresses.');
			return;
		}
		const hasComm = addresses.some(a => a.address_type === 'communication');
		const hasPerm = addresses.some(a => a.address_type === 'permanent');
		
		if (!hasComm) {
			addresses = [...addresses, { ...emptyAddress(), address_type: 'communication' }];
		} else if (!hasPerm) {
			addresses = [...addresses, { ...emptyAddress(), address_type: 'permanent' }];
		} else {
			toast.error('Only Communication and Permanent addresses are allowed.');
		}
	}

	$effect(() => {
		if (isPermSameAsComm) {
			const comm = addresses.find(a => a.address_type === 'communication');
			if (comm) {
				const door_no = comm.door_no;
				const address_line1 = comm.address_line1;
				const address_line2 = comm.address_line2;
				const city = comm.city;
				const state_cuid = comm.state_cuid;
				const country_cuid = comm.country_cuid;
				const pin_code = comm.pin_code;

				untrack(() => {
					let permIndex = addresses.findIndex(a => a.address_type === 'permanent');
					if (permIndex === -1) {
						addresses = [...addresses, { ...comm, address_type: 'permanent' }];
					} else {
						const perm = addresses[permIndex];
						perm.door_no = door_no;
						perm.address_line1 = address_line1;
						perm.address_line2 = address_line2;
						perm.city = city;
						perm.state_cuid = state_cuid;
						perm.country_cuid = country_cuid;
						perm.pin_code = pin_code;
					}
				});
			}
		}
	});

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
				const res = await fetch(`/api/employees/${cuid}/addresses`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
				const body = await res.json();
				if (res.ok && body.data) {
					addresses = body.data;

					const comm = addresses.find((a: AddressItem) => a.address_type === 'communication');
					const perm = addresses.find((a: AddressItem) => a.address_type === 'permanent');
					if (comm && perm) {
						isPermSameAsComm = 
							comm.address_line1 === perm.address_line1 &&
							comm.city === perm.city &&
							comm.state_cuid === perm.state_cuid &&
							comm.country_cuid === perm.country_cuid &&
							comm.pin_code === perm.pin_code;
					}
				}
			} catch (e) {
				console.error('Failed to fetch addresses', e);
			}
		}
		if (addresses.length === 0) {
			addresses = [{ ...emptyAddress(), address_type: 'communication' }];
		}
		originalData = JSON.stringify(normalizeAddresses(addresses));
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
		if (!val || !val.trim()) return ''; // optional in Prisma
		if (!/^[0-9]{6}$/.test(val)) return 'Must be 6 digits';
		return '';
	}

	let hasErrors = $derived(
		addresses.some(a =>
			validateRequired(a.address_type) ||
			validateRequired(a.address_line1) ||
			validateRequired(a.city) ||
			validateRequired(a.country_cuid) ||
			validateRequired(a.state_cuid) ||
			validatePinCode(a.pin_code)
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
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={addAddress} disabled={isSubmitting || addresses.length >= 2}>
				Add Address
			</Button>
		</div>
	{/if}

	{#if addresses.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No address records found.</p>
	{/if}

	{#each addresses as address, index (index)}
		<div class="rounded-lg border border-border p-4 relative">
			{#if mode !== 'view'}
				<div class="flex justify-end mb-2">
					{#if address.address_type !== 'communication'}
						<Button variant="ghost" size="sm" class="h-7 px-2 text-destructive hover:bg-destructive/10" onclick={() => {
							addresses = addresses.filter((_, i) => i !== index);
							if (address.address_type === 'permanent') isPermSameAsComm = false;
						}}>
							Delete
						</Button>
					{/if}
				</div>
			{/if}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
				<SearchableDropdown
					label="Address Type *"
					value={address.address_type}
					options={[
						{ id: 'communication', label: 'Communication' },
						{ id: 'permanent', label: 'Permanent' }
					]}
					onSelect={(val) => address.address_type = val as string}
					disabled={true}
					class={(isTouched && validateRequired(address.address_type)) ? 'border-destructive' : ''}
				/>
				<div class="space-y-2">
					<Label>Door No</Label>
					<Input bind:value={address.door_no} placeholder="Flat/Door No" readonly={address.address_type === 'permanent' && isPermSameAsComm} />
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>Address Line 1 <span class="text-destructive">*</span></Label>
					<Input bind:value={address.address_line1} placeholder="123 Main St" class={(isTouched && validateRequired(address.address_line1)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && validateRequired(address.address_line1)}<p class="text-xs text-destructive">{validateRequired(address.address_line1)}</p>{/if}
				</div>
				<div class="space-y-2 xl:col-span-2">
					<Label>Address Line 2</Label>
					<Input bind:value={address.address_line2} placeholder="Landmark/Area" readonly={address.address_type === 'permanent' && isPermSameAsComm} />
				</div>
				<div class="space-y-2">
					<Label>City <span class="text-destructive">*</span></Label>
					<Input bind:value={address.city} placeholder="City Name" class={(isTouched && validateRequired(address.city)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && validateRequired(address.city)}<p class="text-xs text-destructive">{validateRequired(address.city)}</p>{/if}
				</div>
				<MasterDataDropdown
					master="countries"
					label="Country *"
					value={address.country_cuid}
					onSelect={(val) => address.country_cuid = val as string}
					disabled={mode === 'view' || (address.address_type === 'permanent' && isPermSameAsComm)}
					class={(isTouched && validateRequired(address.country_cuid)) ? 'border-destructive' : ''}
				/>
				<MasterDataDropdown
					master="states"
					label="State *"
					value={address.state_cuid}
					onSelect={(val) => address.state_cuid = val as string}
					disabled={mode === 'view' || (address.address_type === 'permanent' && isPermSameAsComm)}
					class={(isTouched && validateRequired(address.state_cuid)) ? 'border-destructive' : ''}
				/>
				<div class="space-y-2">
					<Label>Pin Code</Label>
					<Input bind:value={address.pin_code} placeholder="123456" class={(isTouched && validatePinCode(address.pin_code)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && validatePinCode(address.pin_code)}<p class="text-xs text-destructive">{validatePinCode(address.pin_code)}</p>{/if}
				</div>
			</div>
			
			{#if address.address_type === 'communication'}
				<div class="xl:col-span-4 flex items-center gap-2 mt-6 pt-4 border-t border-border">
					<input 
						type="checkbox" 
						id="same_as_comm_{index}" 
						bind:checked={isPermSameAsComm} 
						class="rounded border-border text-[#F45310] focus:ring-[#F45310] size-4 cursor-pointer" 
					/>
					<Label for="same_as_comm_{index}" class="cursor-pointer font-medium">Permanent address is same as communication address</Label>
				</div>
			{/if}
		</div>
	{/each}

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting}>
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
