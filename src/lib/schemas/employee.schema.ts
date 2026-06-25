import { z } from 'zod';

// Helper for exact digit string lengths
const digits = (len: number) => z.string().regex(/^\d+$/, `Must contain only digits`).length(len, `Must be exactly ${len} digits`);

// Helper to convert empty strings from frontend to null before validation
export const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.unknown().transform((val) => (val === '' ? null : val)).pipe(schema.optional().nullable());

// Helper to convert empty string dates from frontend to null before validation
export const optionalDate = <T extends z.ZodTypeAny>(schema: T) =>
  z.unknown().transform((val) => (val === '' ? null : val)).pipe(schema);

export const personalSchema = z.object({
  emp_code: optionalString(z.string().regex(/^PQ\d+$/, "Employee code must be in format PQ followed by digits (e.g. PQ001)")),
  first_name: z.string().min(3, "Min 3 characters").regex(/^[a-zA-Z\s]+$/, "Can only contain alphabets and spaces"),
  last_name: z.string().min(3, "Min 3 characters").regex(/^[a-zA-Z\s]+$/, "Can only contain alphabets and spaces"),
  father_name: optionalString(z.string().min(3, "Min 3 characters").regex(/^[a-zA-Z\s]+$/, "Can only contain alphabets and spaces")),
  dob: z.coerce.date().refine(date => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d < today;
  }, "Cannot be today or a future date").refine(date => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age >= 18;
  }, "Must be at least 18 years old").optional().nullable(),
  gender: optionalString(z.string().min(1, "Required")),
  marital_status: optionalString(z.string().min(1, "Required")),
  blood_group_cuid: optionalString(z.string().min(1, "Required")),
  nationality_cuid: optionalString(z.string().min(1, "Required")),
  mobile_no: optionalString(digits(10)),
  personal_email: optionalString(z.string().email("Invalid email format")),
  aadhar_no: optionalString(z.unknown().transform(val => typeof val === 'string' ? val.replace(/\s/g, '') : val).pipe(z.string().regex(/^\d{12}$/, "Aadhaar number must contain exactly 12 digits"))),
  pan_no: optionalString(z.string().length(10, "Must be exactly 10 characters").regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")),
  uan_no: optionalString(z.unknown().transform(val => typeof val === 'string' ? val.replace(/\s/g, '') : val).pipe(z.string().regex(/^\d{12}$/, "Invalid UAN format (must be 12 digits)"))),
  esi_no: optionalString(z.string().regex(/^\d+$/, "ESI Number must contain only digits")),
  pf_account_no: optionalString(z.string().regex(/^[A-Z]{5}\d{17}$/, "PF Account Number must follow EPFO format.")),
  emergency_contact_name: optionalString(z.string().min(3, "Min 3 characters").regex(/^[a-zA-Z\s]+$/, "Can only contain alphabets and spaces")),
  emergency_contact_no: optionalString(digits(10)),
  relation_cuid: optionalString(z.string().min(1, "Required")),
  remarks: optionalString(z.string().regex(/^[a-zA-Z\s.]+$/, "Remarks can only contain alphabets, spaces, and periods"))
});

export const employmentSchema = z.object({
  department_cuid: z.string().min(1, "Required"),
  role_cuid: optionalString(z.string()),
  designation_cuid: z.string().min(1, "Required"),
  pay_grade_cuid: optionalString(z.string()),
  employment_type_cuid: optionalString(z.string()),
  location_cuid: optionalString(z.string()),
  reporting_manager_cuid: optionalString(z.string()),
  employment_status: optionalString(z.string()),
  date_of_joining: optionalDate(z.coerce.date().max(new Date(), "Cannot be a future date").optional().nullable()),
  confirmation_date: optionalDate(z.coerce.date().optional().nullable()),
  relieving_date: optionalDate(z.coerce.date().optional().nullable()),
  official_email: optionalString(z.string().email("Invalid email format"))
}).refine(data => {
  if (data.date_of_joining && data.confirmation_date) {
    return data.confirmation_date >= data.date_of_joining;
  }
  return true;
}, { message: "Cannot be earlier than DOJ", path: ["confirmation_date"] })
.refine(data => {
  if (data.date_of_joining && data.relieving_date) {
    return data.relieving_date >= data.date_of_joining;
  }
  return true;
}, { message: "Cannot be earlier than DOJ", path: ["relieving_date"] });

export const addressSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  address_type: z.string().min(1, "Required"),
  door_no: optionalString(z.string()),
  address_line1: z.string().min(1, "Required"),
  address_line2: optionalString(z.string()),
  city: z.string().min(1, "Required"),
  state_cuid: z.string().min(1, "Required"),
  country_cuid: z.string().min(1, "Required"),
  pin_code: optionalString(digits(6))
});

export const bankDetailSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  account_holder_name: z.string().min(1, "Required"),
  bank_name: z.string().min(1, "Required"),
  account_number: z.string().min(1, "Required").regex(/^\d+$/, "Account number must contain only digits"),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  branch_name: optionalString(z.string()),
  is_primary: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional().default(false)
});

export const educationSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  education_level: z.string().min(1, "Required"),
  specialization: optionalString(z.string()),
  institution: optionalString(z.string()),
  university_board: optionalString(z.string()),
  completed_at: z.coerce.date().max(new Date(), "Cannot be in the future").optional().nullable(),
  percentage: z.coerce.number().min(0, "Must be between 0 and 100").max(100, "Must be between 0 and 100").optional().nullable()
});

export const experienceSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  company_name: z.string().min(1, "Required"),
  role: optionalString(z.string()),
  description: optionalString(z.string()),
  from_date: z.coerce.date().max(new Date(), "Cannot be in the future").optional().nullable(),
  to_date: z.coerce.date().max(new Date(), "Cannot be in the future").optional().nullable()
}).refine(data => {
  if (data.to_date && data.from_date) {
    return data.to_date >= data.from_date;
  }
  return true;
}, { message: "To Date must be greater than or equal to From Date", path: ["to_date"] });

export const documentSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  document_type_cuid: z.string().min(1, "Required"),
  document_base64: optionalString(z.string()),
  mime_type: optionalString(z.string()),
  file_name: optionalString(z.string()),
  file_size: z.union([z.string(), z.number()]).optional().nullable()
}).refine(data => {
  if (data.file_size) {
    return Number(data.file_size) <= 2 * 1024 * 1024;
  }
  return true;
}, { message: "PDF file size must not exceed 2 MB.", path: ["file_size"] })
.refine(data => {
  if (data.mime_type) {
    const allowedTypes = ['application/pdf'];
    return allowedTypes.includes(data.mime_type);
  }
  return true;
}, { message: "Only PDF files are allowed", path: ["mime_type"] });

export const languageSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  language_cuid: z.string().min(1, "Required"),
  proficiency_level: z.string().optional().nullable(),
  can_read: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional().default(false),
  can_write: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional().default(false),
  can_speak: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional().default(false)
});

export const skillSchema = z.object({
  cuid: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  skill_cuid: z.string().min(1, "Required"),
  proficiency_level: z.string().optional().nullable(),
  years_of_experience: z.coerce.number().min(0, "Cannot be negative").optional().nullable()
});
