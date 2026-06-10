export function validateEmpCode(code: string | null | undefined): string {
    if (!code) throw new Error("Employee code is required");
    return code.trim();
}

export function validateName(name: string | null | undefined, fieldName: string): string {
    if (!name) throw new Error(`${fieldName} is required`);
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error(`${fieldName} must be at least 2 characters`);
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

export function validatePan(pan: string | null | undefined): string | null {
    if (!pan) return null;
    const trimmed = pan.trim().toUpperCase();
    if (trimmed === '') return null;
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!regex.test(trimmed)) throw new Error("Invalid PAN format");
    return trimmed;
}

export function validateAadhar(aadhar: string | null | undefined): string | null {
    if (!aadhar) return null;
    const trimmed = aadhar.trim();
    if (trimmed === '') return null;
    const regex = /^\d{12}$/;
    if (!regex.test(trimmed)) throw new Error("Invalid Aadhar format (must be 12 digits)");
    return trimmed;
}

export function validateDob(dob: string | Date | null | undefined): Date | null {
    if (!dob) return null;
    const date = new Date(dob);
    if (isNaN(date.getTime())) throw new Error("Invalid date of birth");
    const today = new Date();
    if (date > today) throw new Error("Date of birth cannot be in the future");
    
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
    }
    if (age < 18) throw new Error("Employee must be at least 18 years old");
    
    return date;
}
