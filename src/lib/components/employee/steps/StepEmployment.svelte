<script lang="ts">
	import { Label, Input, SearchableDropdown, MasterDataDropdown, DatePicker, Button } from '$lib/components';
	import AsyncDropdown from '$lib/components/common/AsyncDropdown.svelte';
	import SimpleMasterModal from '$lib/components/common/SimpleMasterModal.svelte';
	import LocationModal from '$lib/components/organization_locations/LocationModal.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { onMount } from 'svelte';
	import { parseBackendErrors } from '$lib/utils/errors.js';
	import { normalizeText } from '$lib/utils/employeeValidationHelper';

	let { mode, cuid, data, onNext, onPrev, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit';
		cuid: string | null;
		data?: {
			roles?: { cuid: string; name: string }[];
			locations?: { cuid: string; name: string }[];
			employees?: { cuid: string; first_name: string; last_name: string }[];
			employment?: Record<string, unknown>;
		};
		onNext: (cuid?: string) => void;
		onPrev: () => void;
		onDirtyChange?: (dirty: boolean) => void;
		onCancel: () => void;
	}>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);
	let backendErrors = $state<Record<string, string>>({});

	let isDeptModalOpen = $state(false);
	let isDesignationModalOpen = $state(false);
	let isRoleModalOpen = $state(false);
	let isLocationModalOpen = $state(false);
	
	let deptDropdown = $state<ReturnType<typeof AsyncDropdown>>();
	let desigDropdown = $state<ReturnType<typeof AsyncDropdown>>();
	let roleDropdown = $state<ReturnType<typeof AsyncDropdown>>();
	let locationDropdown = $state<ReturnType<typeof AsyncDropdown>>();

	const defaultEmployment = {
		department_cuid: '',
		designation_cuid: '',
		role_cuid: '',
		pay_grade_cuid: '',
		employment_type_cuid: '',
		location_cuid: '',
		reporting_manager_cuid: '',
		date_of_joining: '',
		confirmation_date: '',
		relieving_date: '',
		official_email: '',
		employment_status: 'onboarding'
	};

	let employment = $state({ ...defaultEmployment });
	let originalData = $state(JSON.stringify(defaultEmployment));

	let dateErrors = $state({ doj: false, conf: false, rel: false });

	function normalizeEmployment(data: Partial<typeof defaultEmployment>) {
		const res = { ...defaultEmployment };
		for (const key of Object.keys(defaultEmployment) as Array<keyof typeof defaultEmployment>) {
			let val = data[key];
			if (val === null || val === undefined) {
				val = '';
			}
			let sVal = String(val).trim();

			if (key === 'date_of_joining' || key === 'confirmation_date' || key === 'relieving_date') {
				if (sVal) {
					sVal = sVal.split('T')[0];
				}
			} else if (key === 'official_email') {
				sVal = sVal.toLowerCase();
			}
			res[key] = sVal;
		}
		return res;
	}

	onMount(async () => {
		if (data?.employment) {
			const serverEmp = { ...data.employment };
			const dateFields = ['date_of_joining', 'confirmation_date', 'relieving_date'];
			for (const field of dateFields) {
				if (serverEmp[field] && serverEmp[field] instanceof Date) {
					serverEmp[field] = (serverEmp[field] as Date).toISOString().split('T')[0];
				} else if (serverEmp[field] && typeof serverEmp[field] === 'string') {
					serverEmp[field] = (serverEmp[field] as string).split('T')[0];
				}
			}
			employment = { ...defaultEmployment, ...serverEmp } as typeof employment;
		} else if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}/employment`, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
				const body = await res.json();
				if (res.ok && body.data) {
					employment = { ...defaultEmployment, ...body.data };
				}
			} catch (e) {
				console.error('Failed to fetch employment details', e);
			}
		}
		originalData = JSON.stringify(normalizeEmployment(employment));
	});

	let isDirty = $derived(JSON.stringify(normalizeEmployment(employment)) !== originalData);

	$effect(() => {
		onDirtyChange?.(isDirty);
	});

	function clearBackendError(field: string) {
		if (backendErrors[field]) {
			backendErrors = { ...backendErrors, [field]: '' };
		}
	}

	// Validations
	function validateDropdown(val: string | undefined | null) {
		if (!val) return 'Required';
		return '';
	}
	function validateEmail(val: string | undefined | null) {
		if (!val || !val.length) return 'Required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Invalid email.';
		return '';
	}
	function validateDoj(doj: string) {
		if (!doj) return 'Required';
		const date = new SvelteDate(doj);
		if (isNaN(date.getTime())) return 'Invalid date.';
		if (date > new SvelteDate()) return 'Cannot be a future date.';
		return '';
	}
	function validateConfirmation(doj: string, conf: string) {
		if (!conf) return '';
		if (doj && new SvelteDate(conf) < new SvelteDate(doj)) return 'Cannot be earlier than DOJ.';
		return '';
	}
	function validateRelieving(doj: string, rel: string) {
		if (!rel) return '';
		if (doj && new SvelteDate(rel) < new SvelteDate(doj)) return 'Cannot be earlier than DOJ.';
		return '';
	}

	let errors = $derived({
		department_cuid: backendErrors.department_cuid || validateDropdown(employment.department_cuid),
		designation_cuid: backendErrors.designation_cuid || validateDropdown(employment.designation_cuid),
		role_cuid: backendErrors.role_cuid || '', // optional
		pay_grade_cuid: backendErrors.pay_grade_cuid || '', // optional
		employment_type_cuid: backendErrors.employment_type_cuid || '', // optional
		location_cuid: backendErrors.location_cuid || '', // optional
		employment_status: backendErrors.employment_status || '', // optional
		official_email: backendErrors.official_email || validateEmail(employment.official_email),
		date_of_joining: backendErrors.date_of_joining || validateDoj(employment.date_of_joining),
		confirmation_date: backendErrors.confirmation_date || validateConfirmation(employment.date_of_joining, employment.confirmation_date),
		relieving_date: backendErrors.relieving_date || validateRelieving(employment.date_of_joining, employment.relieving_date)
	});

	let hasErrors = $derived(
		Object.values(errors).some(err => !!err) || Object.values(dateErrors).some(err => !!err)
	);

	// Core save (no navigation) — registered with wizard
	async function saveOnly(): Promise<{ success: boolean }> {
		isTouched = true;
		backendErrors = {};
		if (hasErrors) {
			return { success: false };
		}
		if (!cuid) {
			toast.error('Employee record missing. Please complete Personal Details first.');
			return { success: false };
		}

		try {
			isSubmitting = true;
			const payload = { ...employment, official_email: employment.official_email.toLowerCase() };
			const res = await fetch(`/api/employees/${cuid}/employment`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const body = await res.json();
				const parsed = parseBackendErrors(body);
				if (parsed.field) {
					backendErrors = { [parsed.field]: parsed.message };
				}
				toast.error(parsed.message);
				return { success: false };
			}
			originalData = JSON.stringify(normalizeEmployment(employment));
			toast.success('Updated successfully');

			await invalidateAll();

			return { success: true };
		} catch (e: unknown) {
			toast.error((e as Error).message);
			return { success: false };
		} finally {
			isSubmitting = false;
		}
	}

	// Save + navigate
	async function save() {
		const result = await saveOnly();
		if (!result.success) return;
		onNext();
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
		<AsyncDropdown
			bind:this={deptDropdown}
			apiEndpoint="/api/departments"
			label="Department *"
			value={employment.department_cuid}
			loadingText="Loading departments..."
			errorText="Unable to load departments."
			onSelect={(val) => employment.department_cuid = val as string}
			onAdd={() => isDeptModalOpen = true}
			class={(isTouched && errors.department_cuid) ? 'border-destructive' : ''}
		/>
		<AsyncDropdown
			bind:this={desigDropdown}
			apiEndpoint="/api/designations"
			label="Designation *"
			value={employment.designation_cuid}
			loadingText="Loading designations..."
			errorText="Unable to load designations."
			onSelect={(val) => employment.designation_cuid = val as string}
			onAdd={() => isDesignationModalOpen = true}
			class={(isTouched && errors.designation_cuid) ? 'border-destructive' : ''}
		/>
		<AsyncDropdown
			bind:this={roleDropdown}
			apiEndpoint="/api/roles"
			label="Role *"
			value={employment.role_cuid}
			loadingText="Loading roles..."
			errorText="Unable to load roles."
			onSelect={(val) => employment.role_cuid = val as string}
			onAdd={() => isRoleModalOpen = true}
			class={(isTouched && errors.role_cuid) ? 'border-destructive' : ''}
		/>
		<MasterDataDropdown
			master="pay-grades"
			label="Pay Grade"
			value={employment.pay_grade_cuid}
			onSelect={(val) => employment.pay_grade_cuid = val as string}
			class={(isTouched && errors.pay_grade_cuid) ? 'border-destructive' : ''}
		/>
		<MasterDataDropdown
			master="employment-types"
			label="Employment Type *"
			value={employment.employment_type_cuid}
			onSelect={(val) => employment.employment_type_cuid = val as string}
			class={(isTouched && errors.employment_type_cuid) ? 'border-destructive' : ''}
		/>
		<SearchableDropdown
			label="Employment Status *"
			value={employment.employment_status}
			options={[
				{ id: 'onboarding', label: 'Onboarding' },
				{ id: 'active', label: 'Active' },
				{ id: 'probation', label: 'Probation' },
				{ id: 'notice_period', label: 'Notice Period' },
				{ id: 'terminated', label: 'Terminated' },
				{ id: 'resigned', label: 'Resigned' }
			]}
			onSelect={(val) => employment.employment_status = val as string}
			class={(isTouched && errors.employment_status) ? 'border-destructive' : ''}
		/>
		<AsyncDropdown
			bind:this={locationDropdown}
			apiEndpoint="/api/organization_location"
			label="Company Location *"
			value={employment.location_cuid}
			loadingText="Loading locations..."
			errorText="Unable to load locations."
			onSelect={(val) => employment.location_cuid = val as string}
			onAdd={() => isLocationModalOpen = true}
			class={(isTouched && errors.location_cuid) ? 'border-destructive' : ''}
		/>
		<SearchableDropdown
			label="Reporting Manager"
			value={employment.reporting_manager_cuid}
			options={Array.isArray(data?.employees) ? data.employees.filter((e: any) => e.cuid !== cuid).map((e: { cuid: string, first_name: string, last_name: string }) => ({id: e.cuid, label: e.first_name + ' ' + e.last_name})) : []}
			onSelect={(val) => employment.reporting_manager_cuid = val as string}
		/>
		<div class="space-y-2">
			<Label>Date of Joining <span class="text-destructive">*</span></Label>
			<DatePicker bind:value={employment.date_of_joining} bind:isError={dateErrors.doj} class={(isTouched && errors.date_of_joining) || dateErrors.doj ? 'border-destructive' : ''} />
			{#if isTouched && errors.date_of_joining}
				<p class="text-xs text-destructive">{errors.date_of_joining}</p>
			{:else if isTouched && dateErrors.doj}
				<p class="text-xs text-destructive">Invalid date format.</p>
			{/if}
		</div>
		<div class="space-y-2">
			<Label>Confirmation Date</Label>
			<DatePicker bind:value={employment.confirmation_date} bind:isError={dateErrors.conf} class={(isTouched && errors.confirmation_date) || dateErrors.conf ? 'border-destructive' : ''} />
			{#if isTouched && errors.confirmation_date}
				<p class="text-xs text-destructive">{errors.confirmation_date}</p>
			{:else if isTouched && dateErrors.conf}
				<p class="text-xs text-destructive">Invalid date format.</p>
			{/if}
		</div>
		<div class="space-y-2">
			<Label>Relieving Date</Label>
			<DatePicker bind:value={employment.relieving_date} bind:isError={dateErrors.rel} class={(isTouched && errors.relieving_date) || dateErrors.rel ? 'border-destructive' : ''} />
			{#if isTouched && errors.relieving_date}
				<p class="text-xs text-destructive">{errors.relieving_date}</p>
			{:else if isTouched && dateErrors.rel}
				<p class="text-xs text-destructive">Invalid date format.</p>
			{/if}
		</div>
		<div class="space-y-2">
			<Label>Official Email <span class="text-destructive">*</span></Label>
			<Input type="email" bind:value={employment.official_email} oninput={() => clearBackendError('official_email')} onblur={() => employment.official_email = normalizeText(employment.official_email).toLowerCase()} placeholder="john.doe@company.com" class={(isTouched && errors.official_email) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
			{#if isTouched && errors.official_email}<p class="text-xs text-destructive">{errors.official_email}</p>{/if}
		</div>
	</div>

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" onclick={onPrev} disabled={isSubmitting}>
			Previous
		</Button>
		<div class="space-x-2">
			<Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
				Cancel
			</Button>
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save()} disabled={isSubmitting}>
				Save
			</Button>
		</div>
	</div>
</div>

<SimpleMasterModal
	bind:open={isDeptModalOpen}
	entityName="Department"
	apiEndpoint="/api/departments"
	onSuccess={async (dept) => {
		if (deptDropdown) await deptDropdown.loadOptions();
		employment.department_cuid = dept.cuid;
	}}
/>

<SimpleMasterModal
	bind:open={isDesignationModalOpen}
	entityName="Designation"
	apiEndpoint="/api/designations"
	onSuccess={async (desig) => {
		if (desigDropdown) await desigDropdown.loadOptions();
		employment.designation_cuid = desig.cuid;
	}}
/>

<SimpleMasterModal
	bind:open={isRoleModalOpen}
	entityName="Role"
	apiEndpoint="/api/roles"
	onSuccess={async (role) => {
		if (roleDropdown) await roleDropdown.loadOptions();
		employment.role_cuid = role.cuid;
	}}
/>

<LocationModal 
	bind:open={isLocationModalOpen} 
	onSuccess={async (loc) => {
		if (locationDropdown) await locationDropdown.loadOptions();
		employment.location_cuid = loc.cuid;
	}}
/>
