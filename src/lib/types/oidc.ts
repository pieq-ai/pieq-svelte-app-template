export interface OidcUserProfile {
	sub: string;
	iss?: string;
	aud?: string;
	exp?: number;
	iat?: number;
	email?: string;
	email_verified?: boolean;
	name?: string;
	preferred_username?: string;
	given_name?: string;
	family_name?: string;
	sid?: string;
	typ?: string;
	user_created_at?: string;
}

export interface OidcUserStorage {
	access_token: string;
	expires_at: number;
	id_token: string;
	profile: OidcUserProfile;
	refresh_token: string;
	scope: string;
	session_state: string;
	token_type: string;
}
