export class KeycloakError extends Error {
    constructor(public status: number, message: string, public details?: any) {
        super(message);
        this.name = 'KeycloakError';
    }
}

export class InvalidCredentialsError extends KeycloakError {
    constructor(message: string = 'Invalid credentials', details?: any) {
        super(401, message, details);
        this.name = 'InvalidCredentialsError';
    }
}

export class ForbiddenError extends KeycloakError {
    constructor(message: string = 'Forbidden', details?: any) {
        super(403, message, details);
        this.name = 'ForbiddenError';
    }
}

export class UserNotFoundError extends KeycloakError {
    constructor(message: string = 'User not found', details?: any) {
        super(404, message, details);
        this.name = 'UserNotFoundError';
    }
}

export class UserAlreadyExistsError extends KeycloakError {
    constructor(message: string = 'User already exists', details?: any) {
        super(409, message, details);
        this.name = 'UserAlreadyExistsError';
    }
}

export class KeycloakUnavailableError extends KeycloakError {
    constructor(status: number = 503, message: string = 'Keycloak is unavailable', details?: any) {
        super(status, message, details);
        this.name = 'KeycloakUnavailableError';
    }
}
