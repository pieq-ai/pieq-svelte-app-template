<script lang="ts">
	import { Input, Label, SearchableDropdown, MasterDataDropdown, DatePicker, Button, Textarea } from '$lib/components';
	import { SvelteDate } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { parseBackendErrors } from '$lib/utils/errors.js';
	import { normalizeText } from '$lib/utils/employeeValidationHelper';
	import { getContext } from 'svelte';
	import { EMPLOYEE_API_CONTEXT, type EmployeeApiClient } from '../context';
	import { isFieldEditable } from '$lib/config/profile.config';

	let { mode, cuid, onNext, data, onDirtyChange , onCancel} = $props<{
		mode: 'create' | 'edit';
		cuid: string | null;
		onNext: (cuid?: string) => void;
		data?: Record<string, unknown>;
		onDirtyChange?: (dirty: boolean) => void;
		onCancel: () => void;
	}>();

	let apiClient = getContext<() => EmployeeApiClient>(EMPLOYEE_API_CONTEXT)();

	let isSubmitting = $state(false);
	let isTouched = $state(false);
	let backendErrors = $state<Record<string, string>>({});

	const defaultEmp = {
		emp_code: '',
		first_name: '',
		last_name: '',
		father_name: '',
		dob: '',
		gender: '',
		marital_status: '',
		blood_group_cuid: '',
		nationality_cuid: '',
		mobile_no: '',
		personal_email: '',
		aadhar_no: '',
		pan_no: '',
		uan_no: '',
		esi_no: '',
		pf_account_no: '',
		emergency_contact_name: '',
		emergency_contact_no: '',
		relation_cuid: '',
		remarks: ''
	};

	let emp = $state({ ...defaultEmp });
	let originalData = $state(JSON.stringify(defaultEmp));

	let dateErrors = $state({ dob: false });

	function normalizePersonal(data: Partial<typeof defaultEmp>) {
		const res = { ...defaultEmp };
		for (const key of Object.keys(defaultEmp) as Array<keyof typeof defaultEmp>) {
			let val = data[key];
			if (val === null || val === undefined) {
				val = '';
			}
			let sVal = String(val).trim();
			
			if (key === 'dob') {
				if (sVal) {
					sVal = sVal.split('T')[0];
				}
			} else if (key === 'mobile_no' || key === 'emergency_contact_no') {
				sVal = sVal.replace(/\D/g, '');
			} else if (key === 'personal_email') {
				sVal = sVal.toLowerCase();
			} else if (key === 'aadhar_no' || key === 'uan_no') {
				sVal = sVal.replace(/\D/g, '');
			} else if (key === 'pan_no') {
				sVal = sVal.toUpperCase().replace(/[^A-Z0-9]/g, '');
			} else if (key === 'esi_no') {
				sVal = sVal.replace(/\D/g, '');
			} else if (key === 'pf_account_no') {
				sVal = sVal.replace(/\s/g, '').toUpperCase();
			}
			res[key] = sVal;
		}
		return res;
	}

	onMount(async () => {
		if (data?.employee) {
			const serverEmp = { ...data.employee } as Record<string, unknown>;
			if (serverEmp.dob && serverEmp.dob instanceof Date) {
				serverEmp.dob = (serverEmp.dob as Date).toISOString().split('T')[0];
			} else if (serverEmp.dob && typeof serverEmp.dob === 'string') {
				serverEmp.dob = (serverEmp.dob as string).split('T')[0];
			}
			emp = { ...defaultEmp, ...serverEmp } as typeof emp;
		} else if (mode === 'create' && !cuid) {
			try {
				const res = await fetch('/api/employees/next-code', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
				const body = await res.json();
				if (res.ok && body.data) emp.emp_code = body.data;
			} catch (e) {
				console.error('Failed to fetch next employee code', e);
			}
		} else if (cuid || apiClient.mode === 'self') {
			try {
				const res = await fetch(apiClient.getBaseUrl('personal'), { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
				const body = await res.json();
				if (res.ok && body.data) {
					emp = { ...defaultEmp, ...body.data };
				}
			} catch (e) {
				console.error('Failed to fetch employee details', e);
			}
		}
		originalData = JSON.stringify(normalizePersonal(emp));
	});

	let isDirty = $derived(JSON.stringify(normalizePersonal(emp)) !== originalData);
	
	$effect(() => {
		onDirtyChange?.(isDirty);
	});

	// Formatters
	function formatAadharUan(val: string) {
		let v = val.replace(/\D/g, '').slice(0, 12);
		return v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
	}
	function formatMobile(val: string) {
		return val.replace(/\D/g, '').slice(0, 10);
	}
	function formatPan(val: string) {
		return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
	}
	function formatEsi(val: string) {
		return val.replace(/\D/g, '');
	}

	// Validations
	function validateName(val: string | undefined | null) {
		if (!val || !val.trim()) return 'Required';
		const trimmed = val.trim();
		if (trimmed.length < 3) return 'Min 3 characters.';
		if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'Name can only contain alphabets and spaces.';
		return '';
	}
	function validateMobileRule(val: string | undefined | null) {
		if (!val) return 'Required';
		const digits = val.replace(/\D/g, '');
		if (digits.length !== 10) return 'Must be exactly 10 digits.';
		return '';
	}
	function validatePanRule(val: string | undefined | null) {
		if (!val) return 'Required';
		if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.trim().toUpperCase())) return 'Invalid PAN format (e.g. ABCDE1234F).';
		return '';
	}
	function validateAadharRule(val: string | undefined | null) {
		if (!val) return 'Required';
		const stripped = val.replace(/\s+/g, '');
		if (stripped.length !== 12) return 'Must be exactly 12 digits.';
		return '';
	}
	function validateEmail(val: string | undefined | null) {
		if (!val || !val.trim()) return 'Required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Invalid email format.';
		return '';
	}
	function validatePfAccountRule(val: string | undefined | null) {
		if (!val || !val.trim()) return '';
		const upper = val.trim().toUpperCase();
		if (!/^[A-Z]{5}\d{17}$/.test(upper)) return "PF Account Number must follow EPFO format.";
		return '';
	}
	function validateDropdown(val: string | undefined | null) {
		if (!val) return 'Required';
		return '';
	}

	function validateDob(dob: string) {
		if (!dob) return 'Required';
		const date = new SvelteDate(dob);
		if (isNaN(date.getTime())) return 'Invalid date format.';
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		const dobDate = new SvelteDate(date.getTime());
		dobDate.setHours(0, 0, 0, 0);

		if (dobDate >= today) return 'Cannot be today or a future date.';
		let age = today.getFullYear() - dobDate.getFullYear();
		if (today.getMonth() < dobDate.getMonth() || (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())) {
			age--;
		}
		if (age < 18) return 'Must be at least 18 years old.';
		return '';
	}

	let errors = $derived({
		emp_code: backendErrors.emp_code || '',
		first_name: backendErrors.first_name || validateName(emp.first_name),
		last_name: backendErrors.last_name || validateName(emp.last_name),
		father_name: backendErrors.father_name || validateName(emp.father_name),
		dob: backendErrors.dob || validateDob(emp.dob),
		gender: backendErrors.gender || validateDropdown(emp.gender),
		marital_status: backendErrors.marital_status || validateDropdown(emp.marital_status),
		blood_group_cuid: backendErrors.blood_group_cuid || validateDropdown(emp.blood_group_cuid),
		nationality_cuid: backendErrors.nationality_cuid || validateDropdown(emp.nationality_cuid),
		mobile_no: backendErrors.mobile_no || validateMobileRule(emp.mobile_no),
		personal_email: backendErrors.personal_email || validateEmail(emp.personal_email),
		aadhar_no: backendErrors.aadhar_no || validateAadharRule(emp.aadhar_no),
		pan_no: backendErrors.pan_no || validatePanRule(emp.pan_no),
		pf_account_no: backendErrors.pf_account_no || validatePfAccountRule(emp.pf_account_no),
		emergency_contact_name: backendErrors.emergency_contact_name || validateName(emp.emergency_contact_name),
		emergency_contact_no: backendErrors.emergency_contact_no || validateMobileRule(emp.emergency_contact_no),
		relation_cuid: backendErrors.relation_cuid || validateDropdown(emp.relation_cuid)
	});

	let hasErrors = $derived(
		Object.values(errors).some(err => !!err)
	);

	function inputErrorClass(val: string | undefined | null) {
		return isTouched && !val ? 'border-destructive focus-visible:ring-destructive/50' : '';
	}

	function clearBackendError(field: string) {
		if (backendErrors[field]) {
			backendErrors = { ...backendErrors, [field]: '' };
		}
	}

	let isSaveDisabled = $derived(isSubmitting || hasErrors || (mode === 'edit' && !isDirty));
	async function saveOnly(): Promise<{ success: boolean; cuid?: string }> {
		isTouched = true;
		backendErrors = {};

		if (hasErrors) {
			return { success: false };
		}
		if (mode === 'edit' && !isDirty) return { success: true, cuid: cuid ?? undefined };

		try {
			isSubmitting = true;
			const method = cuid || apiClient.mode === 'self' ? 'PUT' : 'POST';
			const url = apiClient.mode === 'self' ? apiClient.getBaseUrl('personal') : apiClient.getBaseUrl('personal');
			const payload = { ...emp, personal_email: emp.personal_email.toLowerCase().trim() };

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const body = await res.json();
				const parsed = parseBackendErrors(body);
				if (parsed.field) {
					backendErrors = { [parsed.field]: parsed.message };
				} else if (res.status === 409 || parsed.message.toLowerCase().includes('already exists') || parsed.message.toLowerCase().includes('duplicate')) {
					const msgLower = parsed.message.toLowerCase();
					let field = 'emp_code';
					if (msgLower.includes('email')) {
						field = 'personal_email';
					} else if (msgLower.includes('mobile') || msgLower.includes('phone')) {
						field = 'mobile_no';
					} else if (msgLower.includes('aadhar')) {
						field = 'aadhar_no';
					} else if (msgLower.includes('pan')) {
						field = 'pan_no';
					} else if (msgLower.includes('pf')) {
						field = 'pf_account_no';
					}
					backendErrors = { [field]: parsed.message };
				} else {
					toast.error(parsed.message);
				}
				return { success: false };
			}

			const result = await res.json();
			const savedCuid = result.data?.cuid || cuid;

			originalData = JSON.stringify(normalizePersonal(emp));

			toast.success(cuid ? 'Updated successfully' : 'Employee created successfully');

			await invalidateAll();

			return { success: true, cuid: savedCuid ?? undefined };
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
		onNext(result.cuid);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
		<div class="space-y-2">
			<Label>Employee Code</Label>
			<Input bind:value={emp.emp_code} placeholder="Auto-generated" class="bg-muted {inputErrorClass(emp.emp_code)} {(isTouched && errors.emp_code) ? 'border-destructive focus-visible:ring-destructive/50' : ''}" readonly required />
			{#if isTouched && errors.emp_code}<p class="text-xs text-destructive">{errors.emp_code}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>First Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.first_name} oninput={() => clearBackendError('first_name')} onblur={() => emp.first_name = normalizeText(emp.first_name)} placeholder="John" class={(isTouched && errors.first_name) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if isTouched && errors.first_name}<p class="text-xs text-destructive">{errors.first_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Last Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.last_name} oninput={() => clearBackendError('last_name')} onblur={() => emp.last_name = normalizeText(emp.last_name)} placeholder="Doe" class={(isTouched && errors.last_name) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if isTouched && errors.last_name}<p class="text-xs text-destructive">{errors.last_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Father's Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.father_name} oninput={() => clearBackendError('father_name')} onblur={() => emp.father_name = normalizeText(emp.father_name)} placeholder="Father's Name" class={(isTouched && errors.father_name) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
			{#if isTouched && errors.father_name}<p class="text-xs text-destructive">{errors.father_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Date of Birth <span class="text-destructive">*</span></Label>
			<DatePicker bind:value={emp.dob} bind:isError={dateErrors.dob} class={(isTouched && errors.dob) || dateErrors.dob ? 'border-destructive' : ''} />
			{#if isTouched && errors.dob}
				<p class="text-xs text-destructive">{errors.dob}</p>
			{:else if isTouched && dateErrors.dob}
				<p class="text-xs text-destructive">Invalid date format.</p>
			{/if}
		</div>
		<div class="space-y-2">
			<SearchableDropdown label="Gender *" value={emp.gender} options={[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }, { id: 'other', label: 'Other' }]} onSelect={(val) => emp.gender = val as string} class={(isTouched && errors.gender) ? 'border-destructive' : ''} />
			{#if isTouched && errors.gender}<p class="text-xs text-destructive">{errors.gender}</p>{/if}
		</div>
		<div class="space-y-2">
			<SearchableDropdown label="Marital Status *" value={emp.marital_status} options={[{ id: 'single', label: 'Single' }, { id: 'married', label: 'Married' }, { id: 'divorced', label: 'Divorced' }, { id: 'widowed', label: 'Widowed' }]} onSelect={(val) => emp.marital_status = val as string} class={(isTouched && errors.marital_status) ? 'border-destructive' : ''} />
			{#if isTouched && errors.marital_status}<p class="text-xs text-destructive">{errors.marital_status}</p>{/if}
		</div>
		<div class="space-y-2">
			<MasterDataDropdown master="blood-groups" label="Blood Group *" value={emp.blood_group_cuid} onSelect={(val) => emp.blood_group_cuid = val as string} class={(isTouched && errors.blood_group_cuid) ? 'border-destructive' : ''} />
			{#if isTouched && errors.blood_group_cuid}<p class="text-xs text-destructive">{errors.blood_group_cuid}</p>{/if}
		</div>
		<div class="space-y-2">
			<MasterDataDropdown master="nationalities" label="Nationality *" value={emp.nationality_cuid} onSelect={(val) => emp.nationality_cuid = val as string} class={(isTouched && errors.nationality_cuid) ? 'border-destructive' : ''} />
			{#if isTouched && errors.nationality_cuid}<p class="text-xs text-destructive">{errors.nationality_cuid}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Mobile Number <span class="text-destructive">*</span></Label>
			<Input type="tel" bind:value={emp.mobile_no} oninput={(e) => { emp.mobile_no = formatMobile(e.currentTarget.value); clearBackendError('mobile_no'); }} placeholder="1234567890" class={(backendErrors.mobile_no || (isTouched && errors.mobile_no)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if backendErrors.mobile_no}<p class="text-xs text-destructive">{backendErrors.mobile_no}</p>{:else if isTouched && errors.mobile_no}<p class="text-xs text-destructive">{errors.mobile_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Personal Email <span class="text-destructive">*</span></Label>
			<Input type="email" bind:value={emp.personal_email} oninput={() => clearBackendError('personal_email')} onblur={() => emp.personal_email = normalizeText(emp.personal_email).toLowerCase()} placeholder="john@example.com" class={(backendErrors.personal_email || (isTouched && errors.personal_email)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if backendErrors.personal_email}<p class="text-xs text-destructive">{backendErrors.personal_email}</p>{:else if isTouched && errors.personal_email}<p class="text-xs text-destructive">{errors.personal_email}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Aadhar Number <span class="text-destructive">*</span></Label>
			<Input disabled={!isFieldEditable(apiClient.mode, 'aadhar_no')} bind:value={emp.aadhar_no} oninput={(e) => { emp.aadhar_no = formatAadharUan(e.currentTarget.value); clearBackendError('aadhar_no'); }} placeholder="0000 0000 0000" class={(backendErrors.aadhar_no || (isTouched && errors.aadhar_no)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if backendErrors.aadhar_no}<p class="text-xs text-destructive">{backendErrors.aadhar_no}</p>{:else if isTouched && errors.aadhar_no}<p class="text-xs text-destructive">{errors.aadhar_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>PAN Number <span class="text-destructive">*</span></Label>
			<Input disabled={!isFieldEditable(apiClient.mode, 'pan_no')} bind:value={emp.pan_no} oninput={(e) => { emp.pan_no = formatPan(e.currentTarget.value); clearBackendError('pan_no'); }} placeholder="ABCDE1234F" class={(backendErrors.pan_no || (isTouched && errors.pan_no)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} required />
			{#if backendErrors.pan_no}<p class="text-xs text-destructive">{backendErrors.pan_no}</p>{:else if isTouched && errors.pan_no}<p class="text-xs text-destructive">{errors.pan_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>UAN Number</Label>
			<Input disabled={!isFieldEditable(apiClient.mode, 'uan_no')} bind:value={emp.uan_no} oninput={(e) => emp.uan_no = formatAadharUan(e.currentTarget.value)} placeholder="1234 5678 9012" />
		</div>
		<div class="space-y-2">
			<Label>ESI Number</Label>
			<Input bind:value={emp.esi_no} oninput={(e) => emp.esi_no = formatEsi(e.currentTarget.value)} placeholder="ESI Number" />
		</div>
		<div class="space-y-2">
			<Label>PF Account Number</Label>
			<Input bind:value={emp.pf_account_no} oninput={(e) => { emp.pf_account_no = e.currentTarget.value.toUpperCase(); clearBackendError('pf_account_no'); }} placeholder="MHBAN00000160000000134" class={(backendErrors.pf_account_no || (isTouched && errors.pf_account_no)) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
			{#if backendErrors.pf_account_no}<p class="text-xs text-destructive">{backendErrors.pf_account_no}</p>{:else if isTouched && errors.pf_account_no}<p class="text-xs text-destructive">{errors.pf_account_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Emergency Contact Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.emergency_contact_name} onblur={() => emp.emergency_contact_name = normalizeText(emp.emergency_contact_name)} placeholder="Emergency Contact Name" class={(isTouched && errors.emergency_contact_name) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
			{#if isTouched && errors.emergency_contact_name}<p class="text-xs text-destructive">{errors.emergency_contact_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Emergency Contact Number <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.emergency_contact_no} oninput={(e) => emp.emergency_contact_no = formatMobile(e.currentTarget.value)} placeholder="1234567890" class={(isTouched && errors.emergency_contact_no) ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
			{#if isTouched && errors.emergency_contact_no}<p class="text-xs text-destructive">{errors.emergency_contact_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<MasterDataDropdown master="relation-types" label="Relation *" value={emp.relation_cuid} onSelect={(val) => emp.relation_cuid = val as string} class={(isTouched && errors.relation_cuid) ? 'border-destructive' : ''} />
			{#if isTouched && errors.relation_cuid}<p class="text-xs text-destructive">{errors.relation_cuid}</p>{/if}
		</div>
	</div>

	<div class="space-y-2">
		<Label>Remarks</Label>
		<Textarea bind:value={emp.remarks} onblur={() => emp.remarks = normalizeText(emp.remarks)} placeholder="Any additional notes..." rows={3} />
	</div>

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" disabled>
			Previous
		</Button>
		<div class="space-x-2">
			<Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
				Cancel
			</Button>
			<Button class="bg-hrms-primary text-white hover:bg-hrms-primary/90" onclick={() => save()} disabled={isSaveDisabled}>
				Save
			</Button>
		</div>
	</div>
</div>
