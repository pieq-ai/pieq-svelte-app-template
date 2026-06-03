export interface OidcConfig {
	url: string;
	realm: string;
	clientId: string;
	issuer: string;
}

export interface AppConfig {
	apiBaseUrl: string;
	appUrl: string;
	oidc: OidcConfig;
}
