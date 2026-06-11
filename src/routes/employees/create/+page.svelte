<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	/* eslint-disable @typescript-eslint/no-unused-vars */
	import { goto } from '$app/navigation';
	import {
		Badge,
		Button,
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription,
		Input,
		Label,
		MasterDataDropdown,
		SearchableDropdown,
		DatePicker
	} from '$lib/components';
	import DepartmentDropdown from '$lib/components/common/DepartmentDropdown.svelte';
	import DesignationDropdown from '$lib/components/common/DesignationDropdown.svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State
	let isSubmitting = $state(false);
	let isTouched = $state(false);

	// Core Employee
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

	// Employment
	let employment = $state({
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
	});

	// Arrays
	let addresses = $state<any[]>([]);
	let educations = $state<any[]>([]);
	let experiences = $state<any[]>([]);
	let skills = $state<any[]>([]);
	let languages = $state<any[]>([]);
	let bankDetails = $state<any[]>([]);
	let documents = $state<any[]>([]);

	// Helper to add empty array item
	function addAddress() {
		addresses = [...addresses, { address_type: 'communication', door_no: '', address_line1: '', address_line2: '', city: '', state_cuid: '', country_cuid: '', pin_code: '' }];
	}
	function addEducation() {
		educations = [...educations, { education_level: '', specialization: '', institution: '', university_board: '', percentage: '', completed_at: '' }];
	}
	function addExperience() {
		experiences = [...experiences, { company_name: '', role: '', description: '', from_date: '', to_date: '' }];
	}
	function addSkill() {
		skills = [...skills, { skill_cuid: '', proficiency_level: '', years_of_experience: '' }];
	}
	function addLanguage() {
		languages = [...languages, { language_cuid: '', proficiency_level: '', can_read: false, can_write: false, can_speak: false }];
	}
	function addBank() {
		bankDetails = [...bankDetails, { account_holder_name: '', account_number: '', bank_name: '', branch_name: '', ifsc_code: '', is_primary: false }];
	}
	function addDocument() {
		documents = [...documents, { document_type_cuid: '', file_name: '', mime_type: '', file_size: 0 }];
	}

	// Validations
	function validateDob(dob: string) {
		if (!dob) return '';
		const date = new Date(dob);
		const today = new Date();
		if (date > today) return "Date of birth cannot be a future date.";
		const age = today.getFullYear() - date.getFullYear() - (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate()) ? 1 : 0);
		if (age < 18) return "Employee must be at least 18 years old.";
		return '';
	}
	function validateDoj(dob: string, doj: string) {
		if (!doj) return '';
		if (dob && new Date(doj) < new Date(dob)) return "Cannot be before Date of Birth.";
		return '';
	}
	function validateConfirmation(doj: string, conf: string) {
		if (!conf) return '';
		if (doj && new Date(conf) < new Date(doj)) return "Cannot be earlier than joining date.";
		return '';
	}
	function validateRelieving(doj: string, rel: string) {
		if (!rel) return '';
		if (doj && new Date(rel) < new Date(doj)) return "Cannot be earlier than joining date.";
		return '';
	}
	function validatePastDate(date: string) {
		if (!date) return '';
		if (new Date(date) > new Date()) return "Cannot be a future date.";
		return '';
	}
	function validateExperienceDates(from: string, to: string) {
		if (!from || !to) return '';
		if (new Date(from) > new Date(to)) return "From Date cannot be after To Date.";
		return '';
	}

	let errors = $derived({
		dob: validateDob(emp.dob),
		doj: validateDoj(emp.dob, employment.date_of_joining),
		conf: validateConfirmation(employment.date_of_joining, employment.confirmation_date),
		rel: validateRelieving(employment.date_of_joining, employment.relieving_date)
	});

	let dateErrors = $state({
		dob: false,
		doj: false,
		conf: false,
		rel: false
	});

	function inputErrorClass(val: string | undefined | null) {
		return isTouched && !val ? 'border-destructive focus-visible:ring-destructive/50' : '';
	}

	let hasErrors = $derived(
		!!errors.dob || 
		!!errors.doj || 
		!!errors.conf || 
		!!errors.rel ||
		dateErrors.dob ||
		dateErrors.doj ||
		dateErrors.conf ||
		dateErrors.rel ||
		experiences.some(e => validateExperienceDates(e.from_date, e.to_date) || validatePastDate(e.to_date)) || 
		educations.some(e => validatePastDate(e.completed_at))
	);

	async function save(shouldExit: boolean) {
		isTouched = true;
		if (hasErrors) {
			toast.error('Please correct the validation errors before saving.');
			return;
		}

		try {
			isSubmitting = true;

			// 1. Core
			const empRes = await fetch('/api/employees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emp)
			});
			if (!empRes.ok) {
				const body = await empRes.json();
				throw new Error(body.error || 'Failed to create employee');
			}
			const { data: { cuid } } = await empRes.json();

			// 2. Employment
			if (employment.department_cuid && employment.designation_cuid) {
				await fetch(`/api/employees/${cuid}/employment`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(employment)
				});
			}

			// 3. Optional arrays
			if (addresses.length) await fetch(`/api/employees/${cuid}/addresses`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addresses) });
			if (educations.length) await fetch(`/api/employees/${cuid}/educations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(educations) });
			if (experiences.length) await fetch(`/api/employees/${cuid}/experiences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(experiences) });
			if (skills.length) await fetch(`/api/employees/${cuid}/skills`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(skills) });
			if (languages.length) await fetch(`/api/employees/${cuid}/languages`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(languages) });
			if (bankDetails.length) await fetch(`/api/employees/${cuid}/bank-details`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bankDetails) });

			if (shouldExit) {
				// eslint-disable-next-line
				await goto('/employees');
			} else {
				toast.success('Saved successfully!');
			}
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Add Employee</title>
</svelte:head>

<!-- Full width wrapper to use available horizontal space naturally -->
<div class="flex justify-center p-4 md:py-8 bg-muted/10 min-h-screen">
	<div class="w-full max-w-6xl space-y-4">
		<Button variant="ghost" class="pl-0 text-muted-foreground hover:text-foreground mb-2" href="/employees">
			<ArrowLeftIcon class="mr-2 size-4" /> Back to Employees
		</Button>

		<Card class="w-full shadow-sm">
			<CardHeader class="border-b border-border bg-muted/30 pb-6 px-6 md:px-8">
				<CardTitle class="text-2xl font-bold">Add New Employee</CardTitle>
				<CardDescription>Complete the comprehensive onboarding profile.</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y divide-border">
					
					<!-- 1. Core Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div>
							<h3 class="text-lg font-semibold tracking-tight">Employee Details</h3>
							<p class="text-sm text-muted-foreground">Basic personal and identity information.</p>
						</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
					<div class="space-y-2">
						<Label>Employee Code <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.emp_code} placeholder="EMP-001" class={inputErrorClass(emp.emp_code)} required />
					</div>
					<div class="space-y-2">
						<Label>First Name <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.first_name} placeholder="John" class={inputErrorClass(emp.first_name)} required />
					</div>
					<div class="space-y-2">
						<Label>Last Name <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.last_name} placeholder="Doe" class={inputErrorClass(emp.last_name)} required />
					</div>
					<div class="space-y-2">
						<Label>Father's Name</Label>
						<Input bind:value={emp.father_name} placeholder="Father's Name" />
					</div>
					<div class="space-y-2">
						<Label>Date of Birth</Label>
						<DatePicker bind:value={emp.dob} bind:isError={dateErrors.dob} class={(isTouched && errors.dob) || dateErrors.dob ? 'border-destructive' : ''} />
						{#if isTouched && errors.dob}
							<p class="text-xs text-destructive">{errors.dob}</p>
						{:else if isTouched && dateErrors.dob}
							<p class="text-xs text-destructive">Invalid date format.</p>
						{/if}
					</div>
					<SearchableDropdown 
						label="Gender" 
						value={emp.gender} 
						options={[
							{ id: 'male', label: 'Male' },
							{ id: 'female', label: 'Female' },
							{ id: 'other', label: 'Other' }
						]}
						onSelect={(val) => emp.gender = val as string} 
					/>
					<SearchableDropdown 
						label="Marital Status" 
						value={emp.marital_status} 
						options={[
							{ id: 'single', label: 'Single' },
							{ id: 'married', label: 'Married' },
							{ id: 'divorced', label: 'Divorced' },
							{ id: 'widowed', label: 'Widowed' }
						]}
						onSelect={(val) => emp.marital_status = val as string} 
					/>
					<MasterDataDropdown 
						master="blood-groups" 
						label="Blood Group" 
						value={emp.blood_group_cuid} 
						onSelect={(val) => emp.blood_group_cuid = val as string} 
					/>
					<MasterDataDropdown 
						master="nationalities" 
						label="Nationality" 
						value={emp.nationality_cuid} 
						onSelect={(val) => emp.nationality_cuid = val as string} 
					/>
					<div class="space-y-2">
						<Label>Personal Email</Label>
						<Input type="email" bind:value={emp.personal_email} placeholder="john@example.com" />
					</div>
					<div class="space-y-2">
						<Label>Mobile Number</Label>
						<Input type="tel" bind:value={emp.mobile_no} placeholder="+1234567890" />
					</div>
					<div class="space-y-2">
						<Label>Aadhar Number</Label>
						<Input bind:value={emp.aadhar_no} placeholder="0000 0000 0000" />
					</div>
					<div class="space-y-2">
						<Label>PAN Number</Label>
						<Input bind:value={emp.pan_no} placeholder="ABCDE1234F" />
					</div>
					<div class="space-y-2">
						<Label>UAN Number</Label>
						<Input bind:value={emp.uan_no} placeholder="UAN Number" />
					</div>
					<div class="space-y-2">
						<Label>ESI Number</Label>
						<Input bind:value={emp.esi_no} placeholder="ESI Number" />
					</div>
					<div class="space-y-2">
						<Label>Emergency Contact Name</Label>
						<Input bind:value={emp.emergency_contact_name} placeholder="Emergency Contact Name" />
					</div>
					<div class="space-y-2">
						<Label>Emergency Contact Number</Label>
						<Input bind:value={emp.emergency_contact_no} placeholder="Emergency Contact No" />
					</div>
					<MasterDataDropdown 
						master="relation-types" 
						label="Emergency Relation" 
						value={emp.relation_cuid} 
						onSelect={(val) => emp.relation_cuid = val as string} 
					/>
					<div class="space-y-2 xl:col-span-3">
						<Label>Remarks</Label>
						<Input bind:value={emp.remarks} placeholder="Additional comments..." />
					</div>

				</div>
					</div>

					<!-- 2. Employment Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div>
							<h3 class="text-lg font-semibold tracking-tight">Employment Details</h3>
							<p class="text-sm text-muted-foreground">Company roles, positions, and joining data.</p>
						</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
					<DepartmentDropdown 
						label="Department *" 
						value={employment.department_cuid} 
						onSelect={(val) => employment.department_cuid = val as string} 
					/>
					<DesignationDropdown 
						label="Designation *" 
						value={employment.designation_cuid} 
						onSelect={(val) => employment.designation_cuid = val as string} 
					/>
					<SearchableDropdown 
						label="Role" 
						value={employment.role_cuid} 
						options={data.roles?.map((r: any) => ({id: r.cuid, label: r.name})) || []}
						onSelect={(val) => employment.role_cuid = val as string} 
					/>
					<MasterDataDropdown 
						master="pay-grades" 
						label="Pay Grade" 
						value={employment.pay_grade_cuid} 
						onSelect={(val) => employment.pay_grade_cuid = val as string} 
					/>
					<MasterDataDropdown 
						master="employment-types" 
						label="Employment Type" 
						value={employment.employment_type_cuid} 
						permissions={{ canCreate: false, canEdit: false }}
						onSelect={(val) => employment.employment_type_cuid = val as string} 
					/>
					<SearchableDropdown 
						label="Employment Status" 
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
					/>
					<SearchableDropdown 
						label="Company Location" 
						value={employment.location_cuid} 
						options={data.locations.map((l: any) => ({id: l.cuid, label: l.name}))}
						onSelect={(val) => employment.location_cuid = val as string} 
					/>
					<SearchableDropdown 
						label="Reporting Manager" 
						value={employment.reporting_manager_cuid} 
						options={data.employees?.map((e: any) => ({id: e.cuid, label: e.first_name + ' ' + e.last_name})) || []}
						onSelect={(val) => employment.reporting_manager_cuid = val as string} 
					/>
					<div class="space-y-2">
						<Label>Date of Joining</Label>
						<DatePicker bind:value={employment.date_of_joining} bind:isError={dateErrors.doj} class={(isTouched && errors.doj) || dateErrors.doj ? 'border-destructive' : ''} />
						{#if isTouched && errors.doj}
							<p class="text-xs text-destructive">{errors.doj}</p>
						{:else if isTouched && dateErrors.doj}
							<p class="text-xs text-destructive">Invalid date format.</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Confirmation Date</Label>
						<DatePicker bind:value={employment.confirmation_date} bind:isError={dateErrors.conf} class={(isTouched && errors.conf) || dateErrors.conf ? 'border-destructive' : ''} />
						{#if isTouched && errors.conf}
							<p class="text-xs text-destructive">{errors.conf}</p>
						{:else if isTouched && dateErrors.conf}
							<p class="text-xs text-destructive">Invalid date format.</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Relieving Date</Label>
						<DatePicker bind:value={employment.relieving_date} bind:isError={dateErrors.rel} class={(isTouched && errors.rel) || dateErrors.rel ? 'border-destructive' : ''} />
						{#if isTouched && errors.rel}
							<p class="text-xs text-destructive">{errors.rel}</p>
						{:else if isTouched && dateErrors.rel}
							<p class="text-xs text-destructive">Invalid date format.</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Official Email</Label>
						<Input type="email" bind:value={employment.official_email} placeholder="john.doe@company.com" />
					</div>
				</div>
					</div>

					<!-- 3. Address Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div class="flex flex-row items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold tracking-tight">Addresses</h3>
								<p class="text-sm text-muted-foreground">Communication and permanent addresses.</p>
							</div>
							<Button variant="outline" size="sm" onclick={addAddress}>
								<PlusIcon class="mr-2 size-4" /> Add Address
							</Button>
						</div>
				{#each addresses as address, index (address)}
					<div class="rounded-lg border border-border p-4 pt-10 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => addresses = addresses.filter((_, i) => i !== index)}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
							<SearchableDropdown 
								label="Address Type" 
								value={address.address_type} 
								options={[
									{ id: 'communication', label: 'Communication' },
									{ id: 'permanent', label: 'Permanent' }
								]}
								onSelect={(val) => address.address_type = val as string} 
							/>
							<div class="space-y-2">
								<Label>Door No</Label>
								<Input bind:value={address.door_no} placeholder="Flat/Door No" />
							</div>
							<div class="space-y-2 xl:col-span-2">
								<Label>Address Line 1 <span class="text-destructive">*</span></Label>
								<Input bind:value={address.address_line1} placeholder="123 Main St" class={inputErrorClass(address.address_line1)} required />
							</div>
							<div class="space-y-2 xl:col-span-2">
								<Label>Address Line 2</Label>
								<Input bind:value={address.address_line2} placeholder="Landmark/Area" />
							</div>
							<div class="space-y-2">
								<Label>City <span class="text-destructive">*</span></Label>
								<Input bind:value={address.city} placeholder="City Name" class={inputErrorClass(address.city)} required />
							</div>
							<MasterDataDropdown 
								master="countries" 
								label="Country" 
								value={address.country_cuid} 
								onSelect={(val) => address.country_cuid = val as string} 
							/>
							<MasterDataDropdown 
								master="states" 
								label="State" 
								value={address.state_cuid} 
								countryCuid={address.country_cuid}
								onSelect={(val) => address.state_cuid = val as string} 
							/>
							<div class="space-y-2">
								<Label>PIN Code</Label>
								<Input bind:value={address.pin_code} placeholder="ZIP/PIN" />
							</div>
						</div>
					</div>
				{/each}
				{#if addresses.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No addresses added yet. Click 'Add Address' to start.
					</div>
				{/if}
					</div>

					<!-- 4. Bank Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div class="flex flex-row items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold tracking-tight">Bank Details</h3>
								<p class="text-sm text-muted-foreground">Salary and payment accounts.</p>
							</div>
							<Button variant="outline" size="sm" onclick={addBank}>
								<PlusIcon class="mr-2 size-4" /> Add Bank
							</Button>
						</div>
				{#each bankDetails as bank, index (bank)}
					<div class="rounded-lg border border-border p-4 pt-10 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => bankDetails = bankDetails.filter((_, i) => i !== index)}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
							<div class="space-y-2">
								<Label>Bank Name <span class="text-destructive">*</span></Label>
								<Input bind:value={bank.bank_name} placeholder="e.g. Chase Bank" class={inputErrorClass(bank.bank_name)} required />
							</div>
							<div class="space-y-2">
								<Label>Branch Name</Label>
								<Input bind:value={bank.branch_name} placeholder="Downtown Branch" />
							</div>
							<div class="space-y-2">
								<Label>Account Holder Name <span class="text-destructive">*</span></Label>
								<Input bind:value={bank.account_holder_name} placeholder="John Doe" class={inputErrorClass(bank.account_holder_name)} required />
							</div>
							<div class="space-y-2">
								<Label>Account Number <span class="text-destructive">*</span></Label>
								<Input bind:value={bank.account_number} placeholder="000123456789" class={inputErrorClass(bank.account_number)} required />
							</div>
							<div class="space-y-2">
								<Label>Routing / IFSC Code <span class="text-destructive">*</span></Label>
								<Input bind:value={bank.ifsc_code} placeholder="IFSC/Routing" class={inputErrorClass(bank.ifsc_code)} required />
							</div>
							<div class="space-y-2 flex items-end pb-2">
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={bank.is_primary} /> Primary Account</label>
							</div>
						</div>
					</div>
				{/each}
				{#if bankDetails.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No bank accounts added yet.
					</div>
				{/if}
					</div>

					<!-- Documents -->
					<div class="p-6 md:p-8 space-y-6">
						<div class="flex flex-row items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold tracking-tight">Documents</h3>
								<p class="text-sm text-muted-foreground">Employee IDs, certificates, and proofs.</p>
							</div>
							<Button variant="outline" size="sm" onclick={addDocument}>
								<PlusIcon class="mr-2 size-4" /> Add Document
							</Button>
						</div>
				{#each documents as doc, index (doc)}
					<div class="rounded-lg border border-border p-4 pt-10 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => documents = documents.filter((_, i) => i !== index)}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<MasterDataDropdown 
								master="document-types" 
								label="Document Type" 
								value={doc.document_type_cuid} 
								onSelect={(val) => doc.document_type_cuid = val as string} 
							/>
							<div class="space-y-2">
								<Label>File Upload</Label>
								<Input type="file" onchange={(e) => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										doc.file_name = file.name;
										doc.mime_type = file.type;
										doc.file_size = file.size;
									}
								}} />
							</div>
						</div>
					</div>
				{/each}
				{#if documents.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No documents added.
					</div>
				{/if}
					</div>

					<!-- 5. Education Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div class="flex flex-row items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold tracking-tight">Education Details</h3>
								<p class="text-sm text-muted-foreground">Academic qualifications.</p>
							</div>
							<Button variant="outline" size="sm" onclick={addEducation}>
								<PlusIcon class="mr-2 size-4" /> Add Education
							</Button>
						</div>
				{#each educations as edu, index (edu)}
					<div class="rounded-lg border border-border p-4 pt-10 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => educations = educations.filter((_, i) => i !== index)}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
							<SearchableDropdown 
								label="Education Level" 
								value={edu.education_level} 
								options={[
									{ id: 'high_school', label: 'High School' },
									{ id: 'bachelors', label: "Bachelor's" },
									{ id: 'masters', label: "Master's" },
									{ id: 'doctorate', label: 'Doctorate' }
								]}
								onSelect={(val) => edu.education_level = val as string} 
							/>
							<div class="space-y-2">
								<Label>Specialization</Label>
								<Input bind:value={edu.specialization} placeholder="Computer Science" />
							</div>
							<div class="space-y-2">
								<Label>Institution <span class="text-destructive">*</span></Label>
								<Input bind:value={edu.institution} placeholder="University Name" class={inputErrorClass(edu.institution)} required />
							</div>
							<div class="space-y-2">
								<Label>University / Board</Label>
								<Input bind:value={edu.university_board} placeholder="State Board / Univ" />
							</div>
							<div class="space-y-2">
								<Label>Completion Date</Label>
								<DatePicker bind:value={edu.completed_at} class={isTouched && validatePastDate(edu.completed_at) ? 'border-destructive' : ''} />
								{#if isTouched && validatePastDate(edu.completed_at)}
									<p class="text-xs text-destructive">{validatePastDate(edu.completed_at)}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<Label>Percentage / CGPA</Label>
								<Input type="number" step="0.01" bind:value={edu.percentage} placeholder="85.50" />
							</div>
						</div>
					</div>
				{/each}
				{#if educations.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No education details added.
					</div>
				{/if}
					</div>

					<!-- 6. Experience Details -->
					<div class="p-6 md:p-8 space-y-6">
						<div class="flex flex-row items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold tracking-tight">Work Experience</h3>
								<p class="text-sm text-muted-foreground">Previous employment history.</p>
							</div>
							<Button variant="outline" size="sm" onclick={addExperience}>
								<PlusIcon class="mr-2 size-4" /> Add Experience
							</Button>
						</div>
				{#each experiences as exp, index (exp)}
					<div class="rounded-lg border border-border p-4 pt-10 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => experiences = experiences.filter((_, i) => i !== index)}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
							<div class="space-y-2">
								<Label>Company Name <span class="text-destructive">*</span></Label>
								<Input bind:value={exp.company_name} placeholder="Acme Corp" class={inputErrorClass(exp.company_name)} required />
							</div>
							<div class="space-y-2">
								<Label>Role/Designation</Label>
								<Input bind:value={exp.role} placeholder="Software Engineer" />
							</div>
							<div class="space-y-2">
								<Label>From Date</Label>
								<DatePicker bind:value={exp.from_date} class={isTouched && validateExperienceDates(exp.from_date, exp.to_date) ? 'border-destructive' : ''} />
								{#if isTouched && validateExperienceDates(exp.from_date, exp.to_date)}
									<p class="text-xs text-destructive">{validateExperienceDates(exp.from_date, exp.to_date)}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<Label>To Date</Label>
								<DatePicker bind:value={exp.to_date} class={isTouched && validatePastDate(exp.to_date) ? 'border-destructive' : ''} />
								{#if isTouched && validatePastDate(exp.to_date)}
									<p class="text-xs text-destructive">{validatePastDate(exp.to_date)}</p>
								{/if}
							</div>
							<div class="space-y-2 xl:col-span-4">
								<Label>Description</Label>
								<Input bind:value={exp.description} placeholder="Responsibilities and achievements..." />
							</div>
						</div>
					</div>
				{/each}
				{#if experiences.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No experience details added.
					</div>
				{/if}
					</div>

					<!-- 7. Skills & Languages -->
					<div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
						<!-- Skills -->
						<div class="p-6 md:p-8 space-y-6">
							<div class="flex flex-row items-center justify-between">
								<div>
									<h3 class="text-lg font-semibold tracking-tight">Skills</h3>
									<p class="text-sm text-muted-foreground">Professional capabilities.</p>
								</div>
								<Button variant="outline" size="sm" onclick={addSkill}>
									<PlusIcon class="mr-2 size-4" /> Add Skill
								</Button>
							</div>
							<div class="space-y-4">
					{#each skills as skill, index (skill)}
						<div class="flex gap-2 items-start">
							<div class="flex-1">
								<MasterDataDropdown 
									master="skills" 
									label="Skill" 
									value={skill.skill_cuid} 
									onSelect={(val) => skill.skill_cuid = val as string} 
								/>
							</div>
							<div class="flex-1 w-32">
								<SearchableDropdown 
									label="Proficiency" 
									value={skill.proficiency_level} 
									options={[
										{ id: 'beginner', label: 'Beginner' },
										{ id: 'intermediate', label: 'Intermediate' },
										{ id: 'expert', label: 'Expert' }
									]}
									onSelect={(val) => skill.proficiency_level = val as string} 
								/>
							</div>
							<div class="space-y-2 w-32">
								<Label>Years of Exp</Label>
								<Input type="number" step="0.1" bind:value={skill.years_of_experience} placeholder="0.0" />
							</div>
							<Button variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10 mt-7" onclick={() => skills = skills.filter((_, i) => i !== index)}>
								<TrashIcon class="size-4" />
							</Button>
						</div>
							{/each}
							</div>
						</div>

						<!-- Languages -->
						<div class="p-6 md:p-8 space-y-6">
							<div class="flex flex-row items-center justify-between">
								<div>
									<h3 class="text-lg font-semibold tracking-tight">Languages</h3>
									<p class="text-sm text-muted-foreground">Spoken and written.</p>
								</div>
								<Button variant="outline" size="sm" onclick={addLanguage}>
									<PlusIcon class="mr-2 size-4" /> Add Language
								</Button>
							</div>
							<div class="space-y-4">
					{#each languages as lang, index (lang)}
						<div class="flex flex-col gap-2 p-3 pt-10 border border-border rounded-lg relative">
							<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => languages = languages.filter((_, i) => i !== index)}>
								<TrashIcon class="size-4" />
							</Button>
							<div class="flex gap-2 items-start">
								<div class="flex-1">
									<MasterDataDropdown 
										master="languages" 
										label="Language" 
										value={lang.language_cuid} 
										onSelect={(val) => lang.language_cuid = val as string} 
									/>
								</div>
								<div class="flex-1 w-32">
									<SearchableDropdown 
										label="Proficiency" 
										value={lang.proficiency_level} 
										options={[
											{ id: 'beginner', label: 'Beginner' },
											{ id: 'intermediate', label: 'Intermediate' },
											{ id: 'fluent', label: 'Fluent' }
										]}
										onSelect={(val) => lang.proficiency_level = val as string} 
									/>
								</div>
							</div>
							<div class="flex gap-4 mt-2">
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_read} /> Read</label>
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_write} /> Write</label>
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_speak} /> Speak</label>
							</div>
						</div>
							{/each}
							</div>
						</div>
					</div>

					<!-- Form Footer Actions -->
					<div class="p-6 md:p-8 bg-muted/20 border-t border-border">
						<div class="flex items-center justify-end gap-3">
							<Button variant="outline" href="/employees">Cancel</Button>
							<Button variant="secondary" onclick={() => save(true)} disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : 'Save & Exit'}
							</Button>
							<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save(false)} disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : 'Save Profile'}
							</Button>
						</div>
					</div>

				</div>
			</CardContent>
		</Card>
	</div>
</div>
