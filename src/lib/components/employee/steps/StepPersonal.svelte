<script lang="ts">
	import { Input, Label, SearchableDropdown, MasterDataDropdown, DatePicker, Button } from '$lib/components';
	import { SvelteDate } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';


	let { mode, cuid, onNext, data } = $props<{ mode: 'create' | 'edit' | 'view', cuid: string | null, onNext: (cuid?: string) => void, data?: Record<string, unknown> }>();

	let isSubmitting = $state(false);
	let isTouched = $state(false);

	let emp = $state({
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
		emergency_contact_name: '',
		emergency_contact_no: '',
		relation_cuid: '',
		remarks: ''
	});

	let dateErrors = $state({ dob: false });

	onMount(async () => {
		if (data?.employee) {
			const serverEmp = { ...data.employee };
			if (serverEmp.dob && serverEmp.dob instanceof Date) {
				serverEmp.dob = serverEmp.dob.toISOString().split('T')[0];
			} else if (serverEmp.dob && typeof serverEmp.dob === 'string') {
				serverEmp.dob = serverEmp.dob.split('T')[0];
			}
			emp = { ...emp, ...serverEmp };
		} else if (mode === 'create' && !cuid) {
			try {
				const res = await fetch('/api/employees/next-code');
				const body = await res.json();
				if (res.ok && body.data) emp.emp_code = body.data;
			} catch (e) {
				console.error('Failed to fetch next employee code', e);
			}
		} else if (cuid) {
			try {
				const res = await fetch(`/api/employees/${cuid}`);
				const body = await res.json();
				if (res.ok && body.data) {
					emp = { ...emp, ...body.data };
				}
			} catch (e) {
				console.error('Failed to fetch employee details', e);
			}
		}
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
	function formatName(val: string) {
		return val.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ');
	}
	function formatRemarks(val: string) {
		return val.replace(/[^a-zA-Z\s.]/g, '').replace(/\s+/g, ' ');
	}

	// Validations
	function validateName(val: string | undefined | null) {
		if (!val) return 'Required';
		const trimmed = val.trim();
		if (trimmed.length > 0 && trimmed.length < 3) return "Min 3 characters.";
		return '';
	}
	function validateMobileRule(val: string | undefined | null) {
		if (!val) return 'Required';
		if (val.length > 0 && val.length < 10) return "Must be exactly 10 digits.";
		return '';
	}
	function validatePanRule(val: string | undefined | null) {
		if (!val) return 'Required';
		if (val.length > 0 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) return "Invalid PAN format.";
		return '';
	}
	function validateAadharRule(val: string | undefined | null) {
		if (!val) return 'Required';
		const stripped = val.replace(/\s+/g, '');
		if (stripped.length > 0 && stripped.length < 12) return "Must be exactly 12 digits.";
		return '';
	}
	function validateEmail(val: string | undefined | null) {
		if (!val) return 'Required';
		if (val.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email.";
		return '';
	}
	function validateDropdown(val: string | undefined | null) {
		if (!val) return 'Required';
		return '';
	}

	function validateDob(dob: string) {
		if (!dob) return 'Required';
		const date = new SvelteDate(dob);
		if (isNaN(date.getTime())) return "Invalid date format.";
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		const dobDate = new SvelteDate(date.getTime());
		dobDate.setHours(0, 0, 0, 0);

		if (dobDate >= today) return "Cannot be today or a future date.";
		let age = today.getFullYear() - dobDate.getFullYear();
		if (today.getMonth() < dobDate.getMonth() || (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())) {
			age--;
		}
		if (age < 18) return "Must be at least 18 years old.";
		return '';
	}

	let errors = $derived({
		first_name: validateName(emp.first_name),
		last_name: validateName(emp.last_name),
		father_name: validateName(emp.father_name),
		dob: validateDob(emp.dob),
		gender: validateDropdown(emp.gender),
		marital_status: validateDropdown(emp.marital_status),
		blood_group_cuid: validateDropdown(emp.blood_group_cuid),
		nationality_cuid: validateDropdown(emp.nationality_cuid),
		mobile_no: validateMobileRule(emp.mobile_no),
		personal_email: validateEmail(emp.personal_email),
		aadhar_no: validateAadharRule(emp.aadhar_no),
		pan_no: validatePanRule(emp.pan_no),
		emergency_contact_name: validateName(emp.emergency_contact_name),
		emergency_contact_no: validateMobileRule(emp.emergency_contact_no),
		relation_cuid: validateDropdown(emp.relation_cuid)
	});

	let hasErrors = $derived(
		Object.values(errors).some(err => !!err) || dateErrors.dob
	);

	function inputErrorClass(val: string | undefined | null) {
		return isTouched && !val ? 'border-destructive focus-visible:ring-destructive/50' : '';
	}

	async function save(shouldExit: boolean) {
		isTouched = true;
		if (hasErrors) {
			toast.error('Please correct the validation errors before saving.');
			return;
		}

		try {
			isSubmitting = true;
			const method = cuid ? 'PUT' : 'POST';
			const url = cuid ? `/api/employees/${cuid}` : '/api/employees';
			
			// ensure email is lowercase
			const payload = { ...emp, personal_email: emp.personal_email.toLowerCase() };

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || 'Failed to save personal details');
			}
			const result = await res.json();
			const savedCuid = result.data?.cuid || cuid;

			if (shouldExit) {
				window.location.href = '/employees';
			} else {
				onNext(savedCuid);
			}
		} catch (e: unknown) {
			toast.error((e as Error).message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
		<div class="space-y-2">
			<Label>Employee Code <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.emp_code} placeholder="Auto-generated" class="bg-muted {inputErrorClass(emp.emp_code)}" readonly required />
		</div>
		<div class="space-y-2">
			<Label>First Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.first_name} oninput={(e) => emp.first_name = formatName(e.currentTarget.value)} onblur={() => emp.first_name = emp.first_name.trim()} placeholder="John" class={(isTouched && errors.first_name) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.first_name)} readonly={mode === 'view'} required />
			{#if isTouched && errors.first_name}<p class="text-xs text-destructive">{errors.first_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Last Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.last_name} oninput={(e) => emp.last_name = formatName(e.currentTarget.value)} onblur={() => emp.last_name = emp.last_name.trim()} placeholder="Doe" class={(isTouched && errors.last_name) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.last_name)} readonly={mode === 'view'} required />
			{#if isTouched && errors.last_name}<p class="text-xs text-destructive">{errors.last_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Father's Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.father_name} oninput={(e) => emp.father_name = formatName(e.currentTarget.value)} onblur={() => emp.father_name = emp.father_name.trim()} placeholder="Father's Name" class={(isTouched && errors.father_name) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.father_name)} readonly={mode === 'view'} required />
			{#if isTouched && errors.father_name}<p class="text-xs text-destructive">{errors.father_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Date of Birth <span class="text-destructive">*</span></Label>
			<DatePicker bind:value={emp.dob} bind:isError={dateErrors.dob} class={(isTouched && errors.dob) || dateErrors.dob ? 'border-destructive' : ''} disabled={mode === 'view'} />
			{#if isTouched && errors.dob}
				<p class="text-xs text-destructive">{errors.dob}</p>
			{:else if isTouched && dateErrors.dob}
				<p class="text-xs text-destructive">Invalid date format.</p>
			{/if}
		</div>
		<div class="space-y-2">
			<SearchableDropdown label="Gender" value={emp.gender} options={[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }, { id: 'other', label: 'Other' }]} onSelect={(val) => emp.gender = val as string} disabled={mode === 'view'} class={(isTouched && errors.gender) ? 'border-destructive' : ''} />
			{#if isTouched && errors.gender}<p class="text-xs text-destructive">{errors.gender}</p>{/if}
		</div>
		<div class="space-y-2">
			<SearchableDropdown label="Marital Status" value={emp.marital_status} options={[{ id: 'single', label: 'Single' }, { id: 'married', label: 'Married' }, { id: 'divorced', label: 'Divorced' }, { id: 'widowed', label: 'Widowed' }]} onSelect={(val) => emp.marital_status = val as string} disabled={mode === 'view'} class={(isTouched && errors.marital_status) ? 'border-destructive' : ''} />
			{#if isTouched && errors.marital_status}<p class="text-xs text-destructive">{errors.marital_status}</p>{/if}
		</div>
		<div class="space-y-2">
			<MasterDataDropdown master="blood-groups" label="Blood Group" value={emp.blood_group_cuid} onSelect={(val) => emp.blood_group_cuid = val as string} disabled={mode === 'view'} class={(isTouched && errors.blood_group_cuid) ? 'border-destructive' : ''} />
			{#if isTouched && errors.blood_group_cuid}<p class="text-xs text-destructive">{errors.blood_group_cuid}</p>{/if}
		</div>
		<div class="space-y-2">
			<MasterDataDropdown master="nationalities" label="Nationality" value={emp.nationality_cuid} onSelect={(val) => emp.nationality_cuid = val as string} disabled={mode === 'view'} class={(isTouched && errors.nationality_cuid) ? 'border-destructive' : ''} />
			{#if isTouched && errors.nationality_cuid}<p class="text-xs text-destructive">{errors.nationality_cuid}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Mobile Number <span class="text-destructive">*</span></Label>
			<Input type="tel" bind:value={emp.mobile_no} oninput={(e) => emp.mobile_no = formatMobile(e.currentTarget.value)} placeholder="1234567890" class={(isTouched && errors.mobile_no) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.mobile_no)} readonly={mode === 'view'} required />
			{#if isTouched && errors.mobile_no}<p class="text-xs text-destructive">{errors.mobile_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Personal Email <span class="text-destructive">*</span></Label>
			<Input type="email" bind:value={emp.personal_email} onblur={() => emp.personal_email = emp.personal_email.trim().toLowerCase()} placeholder="john@example.com" class={(isTouched && errors.personal_email) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.personal_email)} readonly={mode === 'view'} required />
			{#if isTouched && errors.personal_email}<p class="text-xs text-destructive">{errors.personal_email}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Aadhar Number <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.aadhar_no} oninput={(e) => emp.aadhar_no = formatAadharUan(e.currentTarget.value)} placeholder="0000 0000 0000" class={(isTouched && errors.aadhar_no) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.aadhar_no)} readonly={mode === 'view'} required />
			{#if isTouched && errors.aadhar_no}<p class="text-xs text-destructive">{errors.aadhar_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>PAN Number <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.pan_no} oninput={(e) => emp.pan_no = formatPan(e.currentTarget.value)} placeholder="ABCDE1234F" class={(isTouched && errors.pan_no) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.pan_no)} readonly={mode === 'view'} required />
			{#if isTouched && errors.pan_no}<p class="text-xs text-destructive">{errors.pan_no}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>UAN Number</Label>
			<Input bind:value={emp.uan_no} oninput={(e) => emp.uan_no = formatAadharUan(e.currentTarget.value)} placeholder="1234 5678 9012" readonly={mode === 'view'} />
		</div>
		<div class="space-y-2">
			<Label>ESI Number</Label>
			<Input bind:value={emp.esi_no} oninput={(e) => emp.esi_no = formatEsi(e.currentTarget.value)} placeholder="ESI Number" readonly={mode === 'view'} />
		</div>
		<div class="space-y-2">
			<Label>Emergency Contact Name <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.emergency_contact_name} oninput={(e) => emp.emergency_contact_name = formatName(e.currentTarget.value)} onblur={() => emp.emergency_contact_name = emp.emergency_contact_name.trim()} placeholder="Emergency Contact Name" class={(isTouched && errors.emergency_contact_name) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.emergency_contact_name)} readonly={mode === 'view'} required />
			{#if isTouched && errors.emergency_contact_name}<p class="text-xs text-destructive">{errors.emergency_contact_name}</p>{/if}
		</div>
		<div class="space-y-2">
			<Label>Emergency Contact Number <span class="text-destructive">*</span></Label>
			<Input bind:value={emp.emergency_contact_no} oninput={(e) => emp.emergency_contact_no = formatMobile(e.currentTarget.value)} placeholder="1234567890" class={(isTouched && errors.emergency_contact_no) ? 'border-destructive focus-visible:ring-destructive/50' : inputErrorClass(emp.emergency_contact_no)} readonly={mode === 'view'} required />
			{#if isTouched && errors.emergency_contact_no}<p class="text-xs text-destructive">{errors.emergency_contact_no}</p>{/if}
		</div>
		<div class="space-y-2 pt-3.5">
			<MasterDataDropdown master="relation-types" label="Relation" value={emp.relation_cuid} onSelect={(val) => emp.relation_cuid = val as string} disabled={mode === 'view'} class={(isTouched && errors.relation_cuid) ? 'border-destructive' : ''}  />
			{#if isTouched && errors.relation_cuid}<p class="text-xs text-destructive">{errors.relation_cuid}</p>{/if}
		</div>
	</div>
	
	<div class="space-y-2">
		<Label>Remarks</Label>
		<Input bind:value={emp.remarks} oninput={(e) => emp.remarks = formatRemarks(e.currentTarget.value)} onblur={() => emp.remarks = emp.remarks.trim()} placeholder="Any additional notes..." readonly={mode === 'view'} />
	</div>

	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" disabled>
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
