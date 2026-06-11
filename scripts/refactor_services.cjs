const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/lib/server/services');
const filesToRefactor = [
    'address.service.ts',
    'document.service.ts',
    'education.service.ts',
    'employment.service.ts',
    'experience.service.ts',
    'language.service.ts',
    'skill.service.ts'
];

for (const file of filesToRefactor) {
    const filePath = path.join(servicesDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Ensure ValidationError is imported
        if (!content.includes('ValidationError')) {
            content = "import { ValidationError } from '$lib/server/utils/errors.js';\n" + content;
        }

        // Replace throw new Error("...") with throw new ValidationError("fieldName", "...")
        // Only if it looks like a validation error
        // e.g. throw new Error("Employee CUID2 is required") -> we can keep this as Error since it's 400
        // e.g. throw new Error("Employee with CUID2 ... not found") -> keep as Error (404)
        // e.g. throw new Error("Address type, city, state, country, and address line 1 are required") -> make ValidationError
        // Just look for "are required" or "is required" or "must be" and change if they're not CUID errors.
        
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('throw new Error') && 
                !lines[i].includes('CUID2') && 
                !lines[i].includes('not found')) {
                // It's a validation error
                const fieldName = file.replace('.service.ts', '');
                lines[i] = lines[i].replace(/throw new Error\((['"`])/, `throw new ValidationError("${fieldName}", $1`);
            }
        }
        
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log(`Refactored ${file}`);
    }
}
