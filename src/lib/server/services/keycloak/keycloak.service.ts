import { getKeycloakConfig } from "./config";
import {
  KeycloakError,
  InvalidCredentialsError,
  ForbiddenError,
  UserNotFoundError,
  UserAlreadyExistsError,
  KeycloakUnavailableError,
} from "./errors";
import type {
  KeycloakTokenResponse,
  CreateUserPayload,
  UpdateUserPayload,
  KeycloakUser,
  KeycloakRole,
  KeycloakGroup,
  RequiredActionOptions,
} from "./types";

// Simple structured logger abstraction
const logger = {
  info: (message: string, meta?: any) =>
    console.log(JSON.stringify({ level: "info", message, ...meta })),
  error: (message: string, meta?: any) =>
    console.error(JSON.stringify({ level: "error", message, ...meta })),
};

export class KeycloakService {
  private tokenCache: { token: string; expiresAt: number } | null = null;

  private get config() {
    return getKeycloakConfig();
  }

  /**
   * Handles API response and throws appropriate typed exceptions.
   */
  private async handleResponse(
    response: Response,
    endpoint: string,
  ): Promise<any> {
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    }

    let details;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    switch (response.status) {
      case 401:
        throw new InvalidCredentialsError("Invalid credentials", details);
      case 403:
        throw new ForbiddenError("Forbidden action", details);
      case 404:
        throw new UserNotFoundError("Resource not found", details);
      case 409:
        throw new UserAlreadyExistsError("Resource already exists", details);
      default:
        if (response.status >= 500) {
          throw new KeycloakUnavailableError(
            response.status,
            "Keycloak service unavailable",
            details,
          );
        }
        throw new KeycloakError(
          response.status,
          `Keycloak API error: ${response.statusText}`,
          details,
        );
    }
  }

  /**
   * Wrapper for fetch with structured logging and error mapping.
   * Tokens, passwords, and sensitive bodies are NOT logged.
   */
  private async fetchApi(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    const requestId = crypto.randomUUID();
    const start = performance.now();

    if (!options.headers) options.headers = new Headers();
    const headers = options.headers as Headers;

    if (!path.includes("/token") && !headers.has("Authorization")) {
      const token = await this.getAdminAccessToken();
      headers.set("Authorization", `Bearer ${token}`);
    }

    logger.info("Keycloak request started", {
      endpoint: path,
      method: options.method || "GET",
      requestId,
    });

    try {
      const response = await fetch(url, options);
      const executionTime = performance.now() - start;

      logger.info("Keycloak request completed", {
        endpoint: path,
        method: options.method || "GET",
        statusCode: response.status,
        executionTime,
        requestId,
      });

      return response;
    } catch (error) {
      const executionTime = performance.now() - start;
      logger.error("Keycloak request failed", {
        endpoint: path,
        method: options.method || "GET",
        error: (error as Error).message,
        executionTime,
        requestId,
      });
      throw new KeycloakUnavailableError(
        500,
        "Failed to connect to Keycloak",
        (error as Error).message,
      );
    }
  }

  /**
   * Helper to fetch data and parse response JSON
   */
  private async fetchAndParse(
    path: string,
    options: RequestInit = {},
  ): Promise<any> {
    const response = await this.fetchApi(path, options);
    return this.handleResponse(response, path);
  }

  // --- Authentication ---

  public async getAdminAccessToken(): Promise<string> {
    const now = Date.now();
    // Add a 5 second buffer to expiration
    if (this.tokenCache && this.tokenCache.expiresAt > now + 5000) {
      return this.tokenCache.token;
    }

    const tokenRealm = this.config.clientSecret ? this.config.realm : (this.config.adminRealm || "master");
    const path = `/realms/${tokenRealm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();

    if (this.config.clientSecret) {
      params.append("grant_type", "client_credentials");
      params.append("client_id", this.config.clientId);
      params.append("client_secret", this.config.clientSecret);
    } else if (this.config.adminUsername && this.config.adminPassword) {
      params.append("grant_type", "password");
      params.append("client_id", this.config.clientId);
      params.append("username", this.config.adminUsername);
      params.append("password", this.config.adminPassword);
    }

    const response = await this.fetchApi(path, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body: params,
    });

    const data: KeycloakTokenResponse = await this.handleResponse(
      response,
      path,
    );

    this.tokenCache = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };

    return this.tokenCache.token;
  }

  // --- User APIs ---

  public async createUser(
    payload: CreateUserPayload,
  ): Promise<{ keycloakSub: string }> {
    const path = `/admin/realms/${this.config.realm}/users`;

    const response = await this.fetchApi(path, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        ...payload,
        enabled: payload.enabled ?? true,
        emailVerified: payload.emailVerified ?? false,
        username: payload.username || payload.email,
      }),
    });

    if (!response.ok) {
      await this.handleResponse(response, path);
    }

    const location = response.headers.get("Location");
    if (!location) {
      throw new KeycloakError(
        500,
        "User created but Location header is missing",
      );
    }

    const keycloakSub = location.substring(location.lastIndexOf("/") + 1);
    return { keycloakSub };
  }

  public async getUser(id: string): Promise<KeycloakUser> {
    return this.fetchAndParse(`/admin/realms/${this.config.realm}/users/${id}`);
  }

  public async searchUsers(params: {
    username?: string;
    email?: string;
    search?: string;
  }): Promise<KeycloakUser[]> {
    const query = new URLSearchParams();
    if (params.username) query.append("username", params.username);
    if (params.email) query.append("email", params.email);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.fetchAndParse(
      `/admin/realms/${this.config.realm}/users${queryString}`,
    );
  }

  public async updateUser(
    id: string,
    payload: UpdateUserPayload,
  ): Promise<void> {
    await this.fetchAndParse(`/admin/realms/${this.config.realm}/users/${id}`, {
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
  }

  public async enableUser(id: string): Promise<void> {
    return this.updateUser(id, { enabled: true });
  }

  public async disableUser(id: string): Promise<void> {
    return this.updateUser(id, { enabled: false });
  }

  public async deleteUser(id: string): Promise<void> {
    await this.fetchAndParse(`/admin/realms/${this.config.realm}/users/${id}`, {
      method: "DELETE",
    });
  }

  // --- Password APIs ---

  public async resetPassword(
    id: string,
    password: string,
    temporary: boolean = true,
  ): Promise<void> {
    const path = `/admin/realms/${this.config.realm}/users/${id}/reset-password`;
    await this.fetchAndParse(path, {
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        type: "password",
        value: password,
        temporary,
      }),
    });
  }

  // --- Required Actions ---

  public async triggerRequiredActions(
    id: string,
    actions: string[],
    options?: RequiredActionOptions,
  ): Promise<void> {
    const path = `/admin/realms/${this.config.realm}/users/${id}/execute-actions-email`;

    let url = path;
    const params = new URLSearchParams();
    if (options?.client_id) params.append("client_id", options.client_id);
    if (options?.redirect_uri)
      params.append("redirect_uri", options.redirect_uri);
    if (options?.lifespan)
      params.append("lifespan", options.lifespan.toString());

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    await this.fetchAndParse(url, {
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(actions),
    });
  }

  // --- Realm Roles ---

  public async getRealmRoles(): Promise<KeycloakRole[]> {
    return this.fetchAndParse(`/admin/realms/${this.config.realm}/roles`);
  }

  public async getRealmRole(roleName: string): Promise<KeycloakRole> {
    return this.fetchAndParse(
      `/admin/realms/${this.config.realm}/roles/${roleName}`,
    );
  }

  public async createRealmRole(payload: {
    name: string;
    description?: string;
  }): Promise<void> {
    await this.fetchAndParse(`/admin/realms/${this.config.realm}/roles`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
  }

  public async updateRealmRole(
    roleName: string,
    payload: { name: string; description?: string },
  ): Promise<void> {
    await this.fetchAndParse(
      `/admin/realms/${this.config.realm}/roles/${roleName}`,
      {
        method: "PUT",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      },
    );
  }

  public async deleteRealmRole(roleName: string): Promise<void> {
    await this.fetchAndParse(
      `/admin/realms/${this.config.realm}/roles/${roleName}`,
      {
        method: "DELETE",
      },
    );
  }

  public async getRoleUsers(roleName: string): Promise<KeycloakUser[]> {
    return this.fetchAndParse(
      `/admin/realms/${this.config.realm}/roles/${roleName}/users`,
    );
  }

  public async assignRealmRole(
    userId: string,
    role: KeycloakRole,
  ): Promise<void> {
    await this.fetchAndParse(
      `/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`,
      {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify([
          {
            id: role.id,
            name: role.name,
          },
        ]),
      },
    );
  }

  public async removeRealmRole(
    userId: string,
    role: KeycloakRole,
  ): Promise<void> {
    await this.fetchAndParse(
      `/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`,
      {
        method: "DELETE",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify([
          {
            id: role.id,
            name: role.name,
          },
        ]),
      },
    );
  }

  // --- Groups (Future Ready) ---

  public async getGroups(): Promise<KeycloakGroup[]> {
    return this.fetchAndParse(`/admin/realms/${this.config.realm}/groups`);
  }

  public async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.fetchAndParse(
      `/admin/realms/${this.config.realm}/users/${userId}/groups/${groupId}`,
      {
        method: "PUT",
      },
    );
  }
}
