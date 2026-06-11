export function validateEmpCode(code: string | null | undefined): string {
    if (!code) throw new Error("Employee code is required");
    const trimmed = code.trim();
    if (!/^PQ\d{3}$/.test(trimmed)) throw new Error("Employee code must be in format PQ followed by 3 digits (e.g. PQ001)");
    return trimmed;
}

export function normalizeSpaces(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
}

export function validateName(name: string | null | undefined, fieldName: string): string {
    if (!name) throw new Error(`${fieldName} is required`);
    const normalized = normalizeSpaces(name);
    if (normalized.length < 3) throw new Error(`${fieldName} must be at least 3 characters`);
    if (!/^[a-zA-Z\s]+$/.test(normalized)) throw new Error(`${fieldName} can only contain alphabets and spaces`);
    return normalized;
}

export function validateMobile(mobile: string | null | undefined, fieldName: string = "Mobile Number"): string {
    if (!mobile) throw new Error(`${fieldName} is required`);
    const trimmed = mobile.trim();
    if (trimmed === '') throw new Error(`${fieldName} is required`);
    if (!/^\d{10}$/.test(trimmed)) throw new Error(`${fieldName} must be exactly 10 digits`);
    return trimmed;
}

export function validateEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const trimmed = email.trim();
    if (trimmed === '') return null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) throw new Error("Invalid email format");
    return trimmed;
}

export function validatePan(pan: string | null | undefined): string {
    if (!pan) throw new Error("PAN Number is required");
    const trimmed = pan.trim().toUpperCase();
    if (trimmed === '') throw new Error("PAN Number is required");
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!regex.test(trimmed)) throw new Error("Invalid PAN format (must be 5 letters, 4 numbers, 1 letter)");
    return trimmed;
}

export function validateAadhar(aadhar: string | null | undefined): string {
    if (!aadhar) throw new Error("Aadhaar Number is required");
    const stripped = aadhar.replace(/\s+/g, '');
    if (stripped === '') throw new Error("Aadhaar Number is required");
    if (!/^\d{12}$/.test(stripped)) throw new Error("Invalid Aadhaar format (must be 12 digits)");
    return stripped;
}

export function validateUan(uan: string | null | undefined): string | null {
    if (!uan) return null;
    const stripped = uan.replace(/\s+/g, '');
    if (stripped === '') return null;
    if (!/^\d{12}$/.test(stripped)) throw new Error("Invalid UAN format (must be 12 digits)");
    return stripped;
}

export function validateEsi(esi: string | null | undefined): string | null {
    if (!esi) return null;
    const trimmed = esi.trim();
    if (trimmed === '') return null;
    if (!/^\d+$/.test(trimmed)) throw new Error("ESI Number must contain only digits");
    return trimmed;
}

export function validateRemarks(remarks: string | null | undefined): string | null {
    if (!remarks) return null;
    const normalized = normalizeSpaces(remarks);
    if (normalized === '') return null;
    if (!/^[a-zA-Z\s.]+$/.test(normalized)) throw new Error("Remarks can only contain alphabets, spaces, and periods");
    return normalized;
}

export function validateDob(dob: string | Date | null | undefined): Date {
    if (!dob) throw new Error("Date of birth is required");
    const date = new Date(dob);
    if (isNaN(date.getTime())) throw new Error("Invalid date of birth");
    const today = new Date();
    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    const dobDate = new Date(date.getTime());
    dobDate.setHours(0, 0, 0, 0);

    if (dobDate >= today) throw new Error("Date of birth cannot be today or a future date");
    
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
    }
    if (age < 18) throw new Error("Employee must be at least 18 years old");
    
    return date;
}

export function validateIfsc(ifsc: string | null | undefined): string {
    if (!ifsc) throw new Error("IFSC code is required");
    const trimmed = ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmed)) throw new Error("Invalid IFSC code format");
    return trimmed;
}

export function validatePastDate(dateStr: string | Date | null | undefined, fieldName: string): Date {
    if (!dateStr) throw new Error(`${fieldName} is required`);
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error(`Invalid date for ${fieldName}`);
    if (date > new Date()) throw new Error(`${fieldName} cannot be in the future`);
    return date;
}

export function validatePercentage(percentage: string | number | null | undefined): number {
    if (percentage === null || percentage === undefined || percentage === "") throw new Error("Percentage is required");
    const num = Number(percentage);
    if (isNaN(num) || num < 0 || num > 100) throw new Error("Percentage must be between 0 and 100");
    return num;
}

export function validatePinCode(pin: string | null | undefined): string {
    if (!pin) throw new Error("PIN code is required");
    const trimmed = pin.trim();
    if (!/^[0-9]{6}$/.test(trimmed)) throw new Error("PIN code must be exactly 6 digits");
    return trimmed;
}