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
		SearchableDropdown
	} from '$lib/components';
	import DepartmentDropdown from '$lib/components/common/DepartmentDropdown.svelte';
	import DesignationDropdown from '$lib/components/common/DesignationDropdown.svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
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
		official_email: ''
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
		addresses = [...addresses, { address_type: 'communication', address_line1: '', city: '', state_cuid: '', country_cuid: '', pin_code: '' }];
	}
	function addEducation() {
		educations = [...educations, { education_level: '', specialization: '', institution: '', percentage: '', completion_date: '' }];
	}
	function addExperience() {
		experiences = [...experiences, { company_name: '', role: '', from_date: '', to_date: '' }];
	}
	function addSkill() {
		skills = [...skills, { skill_cuid: '', proficiency_level: '', years_of_experience: '' }];
	}
	function addLanguage() {
		languages = [...languages, { language_cuid: '', proficiency_level: '', can_read: false, can_write: false, can_speak: false }];
	}
	function addBank() {
		bankDetails = [...bankDetails, { account_holder_name: '', account_number: '', bank_name: '', ifsc_code: '', is_primary: false }];
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

	let hasErrors = $derived(
		!!errors.dob || 
		!!errors.doj || 
		!!errors.conf || 
		!!errors.rel ||
		experiences.some(e => validateExperienceDates(e.from_date, e.to_date) || validatePastDate(e.to_date)) || 
		educations.some(e => validatePastDate(e.completion_date))
	);

	async function save(shouldExit: boolean) {
		isTouched = true;
		if (hasErrors) {
			alert('Please correct the validation errors before saving.');
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
				alert('Saved successfully!');
			}
		} catch (e: any) {
			alert(e.message);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Add Employee</title>
</svelte:head>

<!-- Full width wrapper to use available horizontal space naturally -->
<div class="w-full space-y-6 px-4 py-8 md:px-8">
	<!-- Header & Actions -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
		<div class="space-y-1">
			<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
			<h1 class="text-3xl font-bold tracking-tight">Add New Employee</h1>
			<p class="text-muted-foreground">Complete the comprehensive onboarding profile.</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline" href="/employees">Cancel</Button>
			<Button variant="secondary" onclick={() => save(true)} disabled={isSubmitting}>
				{isSubmitting ? 'Saving...' : 'Save & Exit'}
			</Button>
			<Button class="bg-[#F45310] text-white hover:bg-[#F45310]/90" onclick={() => save(false)} disabled={isSubmitting}>
				{isSubmitting ? 'Saving...' : 'Save Profile'}
			</Button>
		</div>
	</div>

	<!-- Form Content -->
	<div class="grid gap-8 grid-cols-1">
		
		<!-- 1. Core Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="pb-4">
				<CardTitle>Employee Details</CardTitle>
				<CardDescription>Basic personal and identity information.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
					<div class="space-y-2">
						<Label>Employee Code <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.emp_code} placeholder="EMP-001" required />
					</div>
					<div class="space-y-2">
						<Label>First Name <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.first_name} placeholder="John" required />
					</div>
					<div class="space-y-2">
						<Label>Last Name <span class="text-destructive">*</span></Label>
						<Input bind:value={emp.last_name} placeholder="Doe" required />
					</div>
					<div class="space-y-2">
						<Label>Date of Birth</Label>
						<Input type="date" bind:value={emp.dob} class={isTouched && errors.dob ? 'border-destructive' : ''} />
						{#if isTouched && errors.dob}
							<p class="text-xs text-destructive">{errors.dob}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Gender</Label>
						<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={emp.gender}>
							<option value="">Select Gender...</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
						</select>
					</div>
					<MasterDataDropdown 
						master="blood-groups" 
						label="Blood Group" 
						value={emp.blood_group_cuid} 
						onSelect={(val) => emp.blood_group_cuid = val} 
					/>
					<MasterDataDropdown 
						master="nationalities" 
						label="Nationality" 
						value={emp.nationality_cuid} 
						onSelect={(val) => emp.nationality_cuid = val} 
					/>
					<div class="space-y-2">
						<Label>Personal Email</Label>
						<Input type="email" bind:value={emp.personal_email} placeholder="john@example.com" />
					</div>
					<div class="space-y-2">
						<Label>Mobile Number</Label>
						<Input type="tel" bind:value={emp.mobile_no} placeholder="+1234567890" />
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- 2. Employment Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="pb-4">
				<CardTitle>Employment Details</CardTitle>
				<CardDescription>Company roles, positions, and joining data.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
					<DepartmentDropdown 
						label="Department *" 
						value={employment.department_cuid} 
						onSelect={(val) => employment.department_cuid = val} 
					/>
					<DesignationDropdown 
						label="Designation *" 
						value={employment.designation_cuid} 
						onSelect={(val) => employment.designation_cuid = val} 
					/>
					<SearchableDropdown 
						label="Role" 
						value={employment.role_cuid} 
						options={data.roles?.map((r: any) => ({id: r.cuid, label: r.role_name})) || []}
						onSelect={(val) => employment.role_cuid = val} 
					/>
					<MasterDataDropdown 
						master="pay-grades" 
						label="Pay Grade" 
						value={employment.pay_grade_cuid} 
						onSelect={(val) => employment.pay_grade_cuid = val} 
					/>
					<MasterDataDropdown 
						master="employment-types" 
						label="Employment Type" 
						value={employment.employment_type_cuid} 
						onSelect={(val) => employment.employment_type_cuid = val} 
					/>
					<SearchableDropdown 
						label="Company Location" 
						value={employment.location_cuid} 
						options={data.locations.map((l: any) => ({id: l.cuid, label: l.name}))}
						onSelect={(val) => employment.location_cuid = val} 
					/>
					<SearchableDropdown 
						label="Reporting Manager" 
						value={employment.reporting_manager_cuid} 
						options={data.employees?.map((e: any) => ({id: e.cuid, label: e.first_name + ' ' + e.last_name})) || []}
						onSelect={(val) => employment.reporting_manager_cuid = val} 
					/>
					<div class="space-y-2">
						<Label>Date of Joining</Label>
						<Input type="date" bind:value={employment.date_of_joining} class={isTouched && errors.doj ? 'border-destructive' : ''} />
						{#if isTouched && errors.doj}
							<p class="text-xs text-destructive">{errors.doj}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Confirmation Date</Label>
						<Input type="date" bind:value={employment.confirmation_date} class={isTouched && errors.conf ? 'border-destructive' : ''} />
						{#if isTouched && errors.conf}
							<p class="text-xs text-destructive">{errors.conf}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Relieving Date</Label>
						<Input type="date" bind:value={employment.relieving_date} class={isTouched && errors.rel ? 'border-destructive' : ''} />
						{#if isTouched && errors.rel}
							<p class="text-xs text-destructive">{errors.rel}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label>Official Email</Label>
						<Input type="email" bind:value={employment.official_email} placeholder="john.doe@company.com" />
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- 3. Address Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<div>
					<CardTitle>Addresses</CardTitle>
					<CardDescription>Communication and permanent addresses.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={addAddress}>
					<PlusIcon class="mr-2 size-4" /> Add Address
				</Button>
			</CardHeader>
			<CardContent class="space-y-6">
				{#each addresses as address, index (index)}
					<div class="rounded-lg border border-border p-4 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => addresses.splice(index, 1) && (addresses = [...addresses])}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
							<div class="space-y-2">
								<Label>Address Type</Label>
								<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={address.address_type}>
									<option value="communication">Communication</option>
									<option value="permanent">Permanent</option>
								</select>
							</div>
							<div class="space-y-2 xl:col-span-2">
								<Label>Address Line 1</Label>
								<Input bind:value={address.address_line1} placeholder="123 Main St" required />
							</div>
							<div class="space-y-2">
								<Label>City</Label>
								<Input bind:value={address.city} placeholder="City Name" required />
							</div>
							<MasterDataDropdown 
								master="countries" 
								label="Country" 
								value={address.country_cuid} 
								onSelect={(val) => address.country_cuid = val} 
							/>
							<MasterDataDropdown 
								master="states" 
								label="State" 
								value={address.state_cuid} 
								onSelect={(val) => address.state_cuid = val} 
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
			</CardContent>
		</Card>

		<!-- 4. Bank Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<div>
					<CardTitle>Bank Details</CardTitle>
					<CardDescription>Salary and payment accounts.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={addBank}>
					<PlusIcon class="mr-2 size-4" /> Add Bank
				</Button>
			</CardHeader>
			<CardContent class="space-y-6">
				{#each bankDetails as bank, index (index)}
					<div class="rounded-lg border border-border p-4 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => bankDetails.splice(index, 1) && (bankDetails = [...bankDetails])}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
							<div class="space-y-2">
								<Label>Bank Name</Label>
								<Input bind:value={bank.bank_name} placeholder="e.g. Chase Bank" required />
							</div>
							<div class="space-y-2">
								<Label>Account Holder Name</Label>
								<Input bind:value={bank.account_holder_name} placeholder="John Doe" required />
							</div>
							<div class="space-y-2">
								<Label>Account Number</Label>
								<Input bind:value={bank.account_number} placeholder="000123456789" required />
							</div>
							<div class="space-y-2">
								<Label>Routing / IFSC Code</Label>
								<Input bind:value={bank.ifsc_code} placeholder="IFSC/Routing" required />
							</div>
						</div>
					</div>
				{/each}
				{#if bankDetails.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No bank accounts added yet.
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Documents -->
		<Card class="w-full shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<div>
					<CardTitle>Documents</CardTitle>
					<CardDescription>Employee IDs, certificates, and proofs.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={addDocument}>
					<PlusIcon class="mr-2 size-4" /> Add Document
				</Button>
			</CardHeader>
			<CardContent class="space-y-6">
				{#each documents as doc, index (index)}
					<div class="rounded-lg border border-border p-4 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => documents.splice(index, 1) && (documents = [...documents])}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
							<MasterDataDropdown 
								master="document-types" 
								label="Document Type" 
								value={doc.document_type_cuid} 
								onSelect={(val) => doc.document_type_cuid = val} 
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
			</CardContent>
		</Card>

		<!-- 5. Education Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<div>
					<CardTitle>Education Details</CardTitle>
					<CardDescription>Academic qualifications.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={addEducation}>
					<PlusIcon class="mr-2 size-4" /> Add Education
				</Button>
			</CardHeader>
			<CardContent class="space-y-6">
				{#each educations as edu, index (index)}
					<div class="rounded-lg border border-border p-4 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => educations.splice(index, 1) && (educations = [...educations])}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-2">
							<div class="space-y-2">
								<Label>Education Level</Label>
								<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={edu.education_level}>
									<option value="high_school">High School</option>
									<option value="bachelors">Bachelor's</option>
									<option value="masters">Master's</option>
									<option value="doctorate">Doctorate</option>
								</select>
							</div>
							<div class="space-y-2">
								<Label>Specialization</Label>
								<Input bind:value={edu.specialization} placeholder="Computer Science" />
							</div>
							<div class="space-y-2">
								<Label>Institution</Label>
								<Input bind:value={edu.institution} placeholder="University Name" required />
							</div>
							<div class="space-y-2">
								<Label>Completion Date</Label>
								<Input type="date" bind:value={edu.completion_date} class={isTouched && validatePastDate(edu.completion_date) ? 'border-destructive' : ''} />
								{#if isTouched && validatePastDate(edu.completion_date)}
									<p class="text-xs text-destructive">{validatePastDate(edu.completion_date)}</p>
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
			</CardContent>
		</Card>

		<!-- 6. Experience Details -->
		<Card class="w-full shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<div>
					<CardTitle>Work Experience</CardTitle>
					<CardDescription>Previous employment history.</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={addExperience}>
					<PlusIcon class="mr-2 size-4" /> Add Experience
				</Button>
			</CardHeader>
			<CardContent class="space-y-6">
				{#each experiences as exp, index (index)}
					<div class="rounded-lg border border-border p-4 relative">
						<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => experiences.splice(index, 1) && (experiences = [...experiences])}>
							<TrashIcon class="size-4" />
						</Button>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
							<div class="space-y-2">
								<Label>Company Name</Label>
								<Input bind:value={exp.company_name} placeholder="Acme Corp" required />
							</div>
							<div class="space-y-2">
								<Label>Role/Designation</Label>
								<Input bind:value={exp.role} placeholder="Software Engineer" />
							</div>
							<div class="space-y-2">
								<Label>From Date</Label>
								<Input type="date" bind:value={exp.from_date} class={isTouched && validateExperienceDates(exp.from_date, exp.to_date) ? 'border-destructive' : ''} />
								{#if isTouched && validateExperienceDates(exp.from_date, exp.to_date)}
									<p class="text-xs text-destructive">{validateExperienceDates(exp.from_date, exp.to_date)}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<Label>To Date</Label>
								<Input type="date" bind:value={exp.to_date} class={isTouched && validatePastDate(exp.to_date) ? 'border-destructive' : ''} />
								{#if isTouched && validatePastDate(exp.to_date)}
									<p class="text-xs text-destructive">{validatePastDate(exp.to_date)}</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
				{#if experiences.length === 0}
					<div class="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
						No experience details added.
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- 7. Skills & Languages -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Skills -->
			<Card class="w-full shadow-sm">
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<div>
						<CardTitle>Skills</CardTitle>
					</div>
					<Button variant="outline" size="sm" onclick={addSkill}>
						<PlusIcon class="mr-2 size-4" /> Add Skill
					</Button>
				</CardHeader>
				<CardContent class="space-y-4">
					{#each skills as skill, index (index)}
						<div class="flex gap-2 items-start">
							<div class="flex-1">
								<MasterDataDropdown 
									master="skills" 
									label="Skill" 
									value={skill.skill_cuid} 
									onSelect={(val) => skill.skill_cuid = val} 
								/>
							</div>
							<div class="space-y-2 w-32">
								<Label>Proficiency</Label>
								<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={skill.proficiency_level}>
									<option value="beginner">Beginner</option>
									<option value="intermediate">Intermediate</option>
									<option value="expert">Expert</option>
								</select>
							</div>
							<Button variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10 mt-7" onclick={() => skills.splice(index, 1) && (skills = [...skills])}>
								<TrashIcon class="size-4" />
							</Button>
						</div>
					{/each}
				</CardContent>
			</Card>

			<!-- Languages -->
			<Card class="w-full shadow-sm">
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<div>
						<CardTitle>Languages</CardTitle>
					</div>
					<Button variant="outline" size="sm" onclick={addLanguage}>
						<PlusIcon class="mr-2 size-4" /> Add Language
					</Button>
				</CardHeader>
				<CardContent class="space-y-4">
					{#each languages as lang, index (index)}
						<div class="flex flex-col gap-2 p-3 border border-border rounded-lg relative">
							<Button variant="ghost" size="icon-sm" class="absolute right-2 top-2 text-destructive hover:bg-destructive/10" onclick={() => languages.splice(index, 1) && (languages = [...languages])}>
								<TrashIcon class="size-4" />
							</Button>
							<div class="flex gap-2 items-start pt-6">
								<div class="flex-1">
									<MasterDataDropdown 
										master="languages" 
										label="Language" 
										value={lang.language_cuid} 
										onSelect={(val) => lang.language_cuid = val} 
									/>
								</div>
								<div class="space-y-2 w-32">
									<Label>Proficiency</Label>
									<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={lang.proficiency_level}>
										<option value="beginner">Beginner</option>
										<option value="intermediate">Intermediate</option>
										<option value="fluent">Fluent</option>
									</select>
								</div>
							</div>
							<div class="flex gap-4 mt-2">
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_read} /> Read</label>
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_write} /> Write</label>
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={lang.can_speak} /> Speak</label>
							</div>
						</div>
					{/each}
				</CardContent>
			</Card>
		</div>

	</div>
</div>
