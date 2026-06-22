// Validation helpers
/** Trims and collapses multiple internal spaces to a single space */
export function normalizeText(val: string): string {
	return val.trim().replace(/\s+/g, ' ');
}

export function isDuplicateEntry<T>(list: T[], index: number, keyFn: (item: T) => string): boolean {
	if (!list || !list[index]) return false;
	const currentKey = keyFn(list[index])?.trim().toLowerCase();
	if (!currentKey) return false;
	return list.findIndex((item, i) => i !== index && keyFn(item)?.trim().toLowerCase() === currentKey) !== -1;
}
export function validateName(val: string | undefined | null) {
	if (!val) return 'Required';
	const trimmed = val.trim();
	if (trimmed.length > 0 && trimmed.length < 3) return "Min 3 characters.";
	return '';
}

export function validateOptionalName(val: string | undefined | null) {
	if (!val || !val.trim()) return ''; // optional
	const trimmed = val.trim();
	if (trimmed.length < 3) return "Min 3 characters.";
	return '';
}

export function validateMobileRule(val: string | undefined | null) {
	if (!val) return 'Required';
	if (val.length > 0 && val.length < 10) return "Must be exactly 10 digits.";
	return '';
}

export function validateOptionalMobile(val: string | undefined | null) {
	if (!val || !val.trim()) return ''; // optional
	const digits = val.replace(/\D/g, '');
	if (digits.length !== 10) return "Must be exactly 10 digits.";
	return '';
}

export function validatePanRule(val: string | undefined | null) {
	if (!val) return 'Required';
	if (val.length > 0 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) return "Invalid PAN format.";
	return '';
}

export function validateAadharRule(val: string | undefined | null) {
	if (!val) return 'Required';
	const stripped = val.replace(/\s+/g, '');
	if (stripped.length > 0 && stripped.length < 12) return "Must be exactly 12 digits.";
	return '';
}

export function validateEmail(val: string | undefined | null) {
	if (!val || !val.trim()) return ''; // optional — format-only when present
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email.";
	return '';
}

export function validateDropdown(val: string | undefined | null) {
	if (!val) return 'Required';
	return '';
}

export function validateDob(dob: string) {
	if (!dob) return ''; // optional in Prisma
	const date = new Date(dob);
	if (isNaN(date.getTime())) return "Invalid date format.";
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dobDate = new Date(date.getTime());
	dobDate.setHours(0, 0, 0, 0);

	if (dobDate >= today) return "Cannot be today or a future date.";
	let age = today.getFullYear() - dobDate.getFullYear();
	if (today.getMonth() < dobDate.getMonth() || (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())) {
		age--;
	}
	if (age < 18) return "Must be at least 18 years old.";
	return '';
}

export function validateDoj(doj: string) {
	if (!doj) return ''; // optional in Prisma
	const date = new Date(doj);
	if (isNaN(date.getTime())) return "Invalid date.";
	if (date > new Date()) return "Cannot be a future date.";
	return '';
}

export function validateConfirmation(doj: string, conf: string) {
	if (!conf) return '';
	if (doj && new Date(conf) < new Date(doj)) return "Cannot be earlier than DOJ.";
	return '';
}

export function validateRelieving(doj: string, rel: string) {
	if (!rel) return '';
	if (doj && new Date(rel) < new Date(doj)) return "Cannot be earlier than DOJ.";
	return '';
}

export function validateRequired(val: string | undefined | null) {
	return val && val.trim().length > 0 ? '' : 'Required';
}

export function validatePinCode(val: string | undefined | null) {
	if (!val || !val.trim()) return ''; // optional in Prisma
	if (!/^[0-9]{6}$/.test(val)) return 'Must be 6 digits';
	return '';
}

export function validatePercentage(val: string | undefined | null) {
	if (!val || !val.trim()) return 'Required';
	const num = parseFloat(val);
	if (isNaN(num) || num < 0 || num > 100) return 'Must be 0-100';
	return '';
}

export function validatePastDate(date: string) {
	if (!date) return 'Required';
	const dt = new Date(date);
	if (isNaN(dt.getTime())) return "Invalid date.";
	if (dt > new Date()) return "Cannot be a future date.";
	return '';
}

export function validateDates(from: string, to: string) {
	// Both dates are optional in Prisma — only validate format/ordering when provided
	if (!from && !to) return '';
	if (from && !to) return '';
	if (!from && to) return '';
	const dFrom = new Date(from);
	const dTo = new Date(to);
	if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) return "Invalid date.";
	if (dTo > new Date()) return "To Date cannot be a future date.";
	if (dFrom > dTo) return "From Date cannot be after To Date.";
	return '';
}

export function validateIfsc(ifsc: string | undefined | null) {
	if (!ifsc) return 'Required';
	const trimmed = ifsc.trim().toUpperCase();
	if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmed)) return "Invalid IFSC code format";
	return '';
}

/** Letters and spaces only (e.g. names, country, city, company) */
export function validateLettersSpaces(val: string | undefined | null, fieldLabel: string = 'Field'): string {
	if (!val || !val.trim()) return ''; // optional by default — caller decides required check
	if (!/^[a-zA-Z\s]+$/.test(val.trim())) return `${fieldLabel} can contain only letters and spaces`;
	return '';
}

/** Letters, numbers and spaces (e.g. skills like "Java 17", "Node.js 20") */
export function validateLettersNumbersSpaces(val: string | undefined | null, fieldLabel: string = 'Field'): string {
	if (!val || !val.trim()) return '';
	if (!/^[a-zA-Z0-9\s]+$/.test(val.trim())) return `${fieldLabel} can contain only letters, numbers, and spaces`;
	return '';
}

/** Digits only (account numbers) */
export function validateAccountNumber(val: string | undefined | null): string {
	if (!val || !val.trim()) return 'Required';
	if (!/^\d+$/.test(val.trim())) return 'Account number can contain only digits';
	return '';
}

/** IFSC input — strip and block special chars (letters + numbers only, no spaces) */
export function validateIfscInput(val: string | undefined | null): string {
	if (!val || !val.trim()) return 'Required';
	const upper = val.trim().toUpperCase();
	if (!/^[A-Z0-9]+$/.test(upper)) return 'IFSC code can contain only letters and numbers';
	if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(upper)) return 'Invalid IFSC format (e.g. SBIN0123456)';
	return '';
}

export interface SectionErrors {
	section: string;
	errors: string[];
}

export interface PersonalDetailsData {
	first_name?: string | null;
	last_name?: string | null;
	father_name?: string | null;
	dob?: string | null;
	gender?: string | null;
	marital_status?: string | null;
	blood_group_cuid?: string | null;
	nationality_cuid?: string | null;
	mobile_no?: string | null;
	personal_email?: string | null;
	aadhar_no?: string | null;
	pan_no?: string | null;
	emergency_contact_name?: string | null;
	emergency_contact_no?: string | null;
	relation_cuid?: string | null;
}

export interface EmploymentDetailsData {
	department_cuid?: string | null;
	designation_cuid?: string | null;
	role_cuid?: string | null;
	pay_grade_cuid?: string | null;
	employment_type_cuid?: string | null;
	employment_status?: string | null;
	location_cuid?: string | null;
	official_email?: string | null;
	date_of_joining?: string | null;
	confirmation_date?: string | null;
	relieving_date?: string | null;
}

export interface AddressData {
	address_type?: string | null;
	address_line1?: string | null;
	city?: string | null;
	state_cuid?: string | null;
	country_cuid?: string | null;
	pin_code?: string | null;
}

export interface EducationData {
	education_level?: string | null;
	specialization?: string | null;
	institution?: string | null;
	university_board?: string | null;
	percentage?: string | number | null;
	completed_at?: string | null;
}

export interface ExperienceData {
	company_name?: string | null;
	role?: string | null;
	from_date?: string | null;
	to_date?: string | null;
}

export interface SkillData {
	skill_cuid?: string | null;
	proficiency_level?: string | null;
}

export interface LanguageData {
	language_cuid?: string | null;
	proficiency_level?: string | null;
}

export interface DocumentData {
	document_type_cuid?: string | null;
	file_name?: string | null;
}

export interface BankData {
	bank_name?: string | null;
	account_holder_name?: string | null;
	account_number?: string | null;
	ifsc_code?: string | null;
}

// ─── Full-profile completion validators (used on final submit) ─────────────────
// These match Prisma schema source of truth:
//   - first_name, last_name: REQUIRED (String in Prisma)
//   - mobile_no, aadhar_no, pan_no: business-required (kept as required)
//   - department_cuid, designation_cuid: REQUIRED (String in Prisma)
//   - All other fields: optional

export function validatePersonal(emp: PersonalDetailsData): string[] {
	const errors: string[] = [];
	// Required fields
	if (validateName(emp.first_name)) errors.push(`First Name: ${validateName(emp.first_name)}`);
	if (validateName(emp.last_name)) errors.push(`Last Name: ${validateName(emp.last_name)}`);
	// Business-required
	if (validateMobileRule(emp.mobile_no)) errors.push(`Mobile Number: ${validateMobileRule(emp.mobile_no)}`);
	if (validateAadharRule(emp.aadhar_no)) errors.push(`Aadhar Number: ${validateAadharRule(emp.aadhar_no)}`);
	if (validatePanRule(emp.pan_no)) errors.push(`PAN Number: ${validatePanRule(emp.pan_no)}`);
	// Optional — validate format only when present
	if (validateDob(emp.dob || '')) errors.push(`Date of Birth: ${validateDob(emp.dob || '')}`);
	if (validateEmail(emp.personal_email)) errors.push(`Personal Email: ${validateEmail(emp.personal_email)}`);
	if (validateOptionalName(emp.father_name)) errors.push(`Father's Name: ${validateOptionalName(emp.father_name)}`);

	if (validateDropdown(emp.gender)) errors.push(`Gender: ${validateDropdown(emp.gender)}`);
	if (validateDropdown(emp.marital_status)) errors.push(`Marital Status: ${validateDropdown(emp.marital_status)}`);
	if (validateDropdown(emp.blood_group_cuid)) errors.push(`Blood Group: ${validateDropdown(emp.blood_group_cuid)}`);
	if (validateDropdown(emp.nationality_cuid)) errors.push(`Nationality: ${validateDropdown(emp.nationality_cuid)}`);
	
	if (validateName(emp.emergency_contact_name)) errors.push(`Emergency Contact Name: ${validateName(emp.emergency_contact_name)}`);
	if (validateMobileRule(emp.emergency_contact_no)) errors.push(`Emergency Contact Number: ${validateMobileRule(emp.emergency_contact_no)}`);
	if (validateDropdown(emp.relation_cuid)) errors.push(`Relation: ${validateDropdown(emp.relation_cuid)}`);
	
	return errors;
}

export function validateEmployment(emp: EmploymentDetailsData): string[] {
	const errors: string[] = [];
	if (!emp) {
		errors.push("Employment details are missing.");
		return errors;
	}
	// Required in Prisma
	if (validateDropdown(emp.department_cuid)) errors.push(`Department: ${validateDropdown(emp.department_cuid)}`);
	if (validateDropdown(emp.designation_cuid)) errors.push(`Designation: ${validateDropdown(emp.designation_cuid)}`);
	// Optional — validate format when present
	if (validateDoj(emp.date_of_joining || '')) errors.push(`Date of Joining: ${validateDoj(emp.date_of_joining || '')}`);
	if (validateConfirmation(emp.date_of_joining || '', emp.confirmation_date || '')) errors.push(`Confirmation Date: ${validateConfirmation(emp.date_of_joining || '', emp.confirmation_date || '')}`);
	if (validateRelieving(emp.date_of_joining || '', emp.relieving_date || '')) errors.push(`Relieving Date: ${validateRelieving(emp.date_of_joining || '', emp.relieving_date || '')}`);
	if (validateEmail(emp.official_email)) errors.push(`Official Email: ${validateEmail(emp.official_email)}`);
	return errors;
}

export function validateAddresses(addresses: AddressData[]): string[] {
	const errors: string[] = [];
	if (!addresses || addresses.length === 0) {
		errors.push("At least one address is required.");
		return errors;
	}
	addresses.forEach((a, index) => {
		const prefix = `Address #${index + 1}`;
		if (validateRequired(a.address_type)) errors.push(`${prefix} Type: Required`);
		if (validateRequired(a.address_line1)) errors.push(`${prefix} Line 1: Required`);
		if (validateRequired(a.city)) errors.push(`${prefix} City: Required`);
		if (validateRequired(a.state_cuid)) errors.push(`${prefix} State: Required`);
		if (validateRequired(a.country_cuid)) errors.push(`${prefix} Country: Required`);
		// pin_code is optional — only validate format when present
		if (validatePinCode(a.pin_code)) errors.push(`${prefix} PIN Code: ${validatePinCode(a.pin_code)}`);
	});
	return errors;
}

export function validateEducations(educations: EducationData[]): string[] {
	const errors: string[] = [];
	// educations section is optional overall — skip if empty
	if (!educations || educations.length === 0) return errors;
	educations.forEach((e, index) => {
		const prefix = `Education #${index + 1}`;
		// Only education_level is required when an entry exists
		if (validateRequired(e.education_level)) errors.push(`${prefix} Level: Required`);
		// All other fields are optional — validate format only
		if (validatePercentage(e.percentage?.toString())) errors.push(`${prefix} Percentage: ${validatePercentage(e.percentage?.toString())}`);
		if (validatePastDate(e.completed_at || '')) errors.push(`${prefix} Completed At: ${validatePastDate(e.completed_at || '')}`);
	});
	return errors;
}

export function validateExperiences(experiences: ExperienceData[]): string[] {
	const errors: string[] = [];
	// experiences section is optional overall — skip if empty
	if (!experiences || experiences.length === 0) return errors;
	experiences.forEach((e, index) => {
		const prefix = `Experience #${index + 1}`;
		// Only company_name is required when an entry exists
		if (validateRequired(e.company_name)) errors.push(`${prefix} Company Name: Required`);
		// Date ordering only when both present
		if (validateDates(e.from_date || '', e.to_date || '')) errors.push(`${prefix} Dates: ${validateDates(e.from_date || '', e.to_date || '')}`);
	});
	return errors;
}

export function validateSkills(skills: SkillData[]): string[] {
	const errors: string[] = [];
	// skills section is optional overall — skip if empty
	if (!skills || skills.length === 0) return errors;
	skills.forEach((s, index) => {
		const prefix = `Skill #${index + 1}`;
		if (validateRequired(s.skill_cuid)) errors.push(`${prefix} Skill Name: Required`);
		// proficiency_level is optional
	});
	return errors;
}

export function validateLanguages(languages: LanguageData[]): string[] {
	const errors: string[] = [];
	// languages section is optional overall — skip if empty
	if (!languages || languages.length === 0) return errors;
	languages.forEach((l, index) => {
		const prefix = `Language #${index + 1}`;
		if (validateRequired(l.language_cuid)) errors.push(`${prefix} Language: Required`);
		// proficiency_level is optional
	});
	return errors;
}

export function validateDocuments(documents: DocumentData[]): string[] {
	const errors: string[] = [];
	if (!documents) return errors;
	documents.forEach((d, index) => {
		const prefix = `Document #${index + 1}`;
		if (validateRequired(d.document_type_cuid)) errors.push(`${prefix} Type: Required`);
		if (validateRequired(d.file_name)) errors.push(`${prefix} File: Required`);
	});
	return errors;
}

export function validateBankDetails(banks: BankData[]): string[] {
	const errors: string[] = [];
	if (!banks || banks.length === 0) {
		errors.push("At least one bank account is required.");
		return errors;
	}
	banks.forEach((b, index) => {
		const prefix = `Bank #${index + 1}`;
		if (validateRequired(b.bank_name)) errors.push(`${prefix} Name: Required`);
		if (validateRequired(b.account_holder_name)) errors.push(`${prefix} Account Holder Name: Required`);
		if (validateRequired(b.account_number)) errors.push(`${prefix} Account Number: Required`);
		if (validateIfsc(b.ifsc_code)) errors.push(`${prefix} IFSC Code: ${validateIfsc(b.ifsc_code)}`);
	});
	return errors;
}
