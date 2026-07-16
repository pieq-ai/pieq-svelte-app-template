export interface KeycloakTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    'not-before-policy': number;
    scope: string;
}

export interface KeycloakUser {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    emailVerified?: boolean;
    enabled?: boolean;
    attributes?: Record<string, string[]>;
}

export interface CreateUserPayload {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    emailVerified?: boolean;
}

export interface UpdateUserPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    emailVerified?: boolean;
    enabled?: boolean;
    attributes?: Record<string, string[]>;
}

export interface KeycloakRole {
    id: string;
    name: string;
    description?: string;
    composite: boolean;
    clientRole: boolean;
    containerId: string;
}

export interface KeycloakGroup {
    id: string;
    name: string;
    path: string;
    subGroups?: KeycloakGroup[];
}

export interface RequiredActionOptions {
    redirect_uri?: string;
    client_id?: string;
    lifespan?: number;
}
