<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, Button, Checkbox } from '$lib/components';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { normalizeText, validateLettersSpaces } from '$lib/utils/employeeValidationHelper';
	import { onMount, untrack, getContext } from 'svelte';
	import { EMPLOYEE_API_CONTEXT, type EmployeeApiClient } from '../context';

	let { mode, cuid, onNext, onPrev, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit';
		cuid: string | null;
		onNext: (cuid?: string) => void;
		onPrev: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onCancel: () => void;
	}>();

	let apiClient = getContext<() => EmployeeApiClient>(EMPLOYEE_API_CONTEXT)();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	type AddressItem = { address_type: string; door_no: string; address_line1: string; address_line2: string; city: string; state_cuid: string; country_cuid: string; pin_code: string };

	const emptyAddress = (): AddressItem => ({ address_type: 'communication', door_no: '', address_line1: '', address_line2: '', city: '', state_cuid: '', country_cuid: '', pin_code: '' });

	let addresses = $state<AddressItem[]>([]);
	let originalData = $state('[]');

	let isPermSameAsComm = $state(false);

	// Both addresses are always present; no need to dynamically add them.

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
		if (cuid && apiClient.mode !== 'self') {
			try {
				const res = await fetch(apiClient.getBaseUrl('addresses'), { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
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
			addresses = [
				{ ...emptyAddress(), address_type: 'communication' },
				{ ...emptyAddress(), address_type: 'permanent' }
			];
		} else {
			const hasComm = addresses.some(a => a.address_type === 'communication');
			const hasPerm = addresses.some(a => a.address_type === 'permanent');
			if (!hasComm) addresses = [{ ...emptyAddress(), address_type: 'communication' }, ...addresses];
			if (!hasPerm) addresses = [...addresses, { ...emptyAddress(), address_type: 'permanent' }];
			
			addresses.sort((a, b) => a.address_type === 'communication' ? -1 : 1);
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
	function cityError(val: string) {
		return validateRequired(val) || validateLettersSpaces(val, 'City');
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
			cityError(a.city) ||
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
			const res = await fetch(apiClient.getBaseUrl('addresses'), {
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

<div class="space-y-6">
	{#if addresses.length === 0 && mode === 'view'}
		<p class="text-sm text-muted-foreground text-center py-4">No address records found.</p>
	{/if}

	{#each addresses as address, index (address.address_type)}
		<div class="border border-border rounded-xl p-4 sm:p-6 bg-card text-card-foreground shadow-sm mb-6">
			<h2 class="text-lg font-semibold tracking-tight border-b border-border pb-3 mb-5">
				{address.address_type === 'communication' ? 'Communication Address' : 'Permanent Address'}
			</h2>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
				<div class="space-y-2 sm:col-span-2 md:col-span-3">
					<Label>Door No</Label>
					<Input bind:value={address.door_no} placeholder="Flat/Door No" onblur={() => address.door_no = normalizeText(address.door_no)} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
				</div>
				<div class="space-y-2 sm:col-span-2 md:col-span-3">
					<Label>Address Line 1 <span class="text-destructive">*</span></Label>
					<Input bind:value={address.address_line1} placeholder="123 Main St" onblur={() => address.address_line1 = normalizeText(address.address_line1)} class={(isTouched && validateRequired(address.address_line1)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && validateRequired(address.address_line1)}<p class="text-xs text-destructive">{validateRequired(address.address_line1)}</p>{/if}
				</div>
				<div class="space-y-2 sm:col-span-2 md:col-span-3">
					<Label>Address Line 2</Label>
					<Input bind:value={address.address_line2} placeholder="Landmark/Area" onblur={() => address.address_line2 = normalizeText(address.address_line2)} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
				</div>
				<div class="space-y-2">
					<Label>City <span class="text-destructive">*</span></Label>
					<Input bind:value={address.city} placeholder="City Name" onblur={() => address.city = normalizeText(address.city)} class={(isTouched && cityError(address.city)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && cityError(address.city)}<p class="text-xs text-destructive">{cityError(address.city)}</p>{/if}
				</div>
				<MasterDataDropdown
					master="states"
					label="State *"
					value={address.state_cuid}
					countryCuid={address.country_cuid}
					placeholder={!address.country_cuid ? 'Select Country first' : 'Select State'}
					onSelect={(val) => address.state_cuid = val as string}
					disabled={mode === 'view' || (address.address_type === 'permanent' && isPermSameAsComm) || !address.country_cuid}
					class={(isTouched && validateRequired(address.state_cuid)) ? 'border-destructive' : ''}
				/>
				{#if isTouched && validateRequired(address.state_cuid)}
					<p class="text-xs text-destructive">{validateRequired(address.state_cuid)}</p>
				{/if}
				<MasterDataDropdown
					master="countries"
					label="Country *"
					value={address.country_cuid}
					onSelect={(val) => {
						if (address.country_cuid !== val) {
							address.country_cuid = val as string;
							address.state_cuid = '';
						}
					}}
					disabled={mode === 'view' || (address.address_type === 'permanent' && isPermSameAsComm)}
					class={(isTouched && validateRequired(address.country_cuid)) ? 'border-destructive' : ''}
				/>
				{#if isTouched && validateRequired(address.country_cuid)}
					<p class="text-xs text-destructive">{validateRequired(address.country_cuid)}</p>
				{/if}
				<div class="space-y-2">
					<Label>Pin Code</Label>
					<Input bind:value={address.pin_code} placeholder="123456" class={(isTouched && validatePinCode(address.pin_code)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} readonly={address.address_type === 'permanent' && isPermSameAsComm} />
					{#if isTouched && validatePinCode(address.pin_code)}<p class="text-xs text-destructive">{validatePinCode(address.pin_code)}</p>{/if}
				</div>
			</div>
		</div>

		{#if address.address_type === 'communication'}
			<div class="flex items-center gap-2 mb-6 ml-2">
				<Checkbox 
					id="same_as_comm" 
					bind:checked={isPermSameAsComm} 
				/>
				<Label for="same_as_comm" class="cursor-pointer font-medium">Permanent address same as communication address</Label>
			</div>
		{/if}
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
				<Button class="bg-hrms-primary text-white hover:bg-hrms-primary/90" onclick={() => save()} disabled={isSubmitting}>
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
