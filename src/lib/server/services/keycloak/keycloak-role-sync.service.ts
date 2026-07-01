import { KeycloakService } from "./keycloak.service";
import { UserNotFoundError, KeycloakError } from "./errors";

const keycloak = new KeycloakService();

export class KeycloakRoleSyncService {
  /**
   * Synchronizes a newly created HRMS System Role to Keycloak.
   * Prevents duplicates by checking if the Realm Role already exists.
   */
  static async syncRoleCreated(name: string): Promise<void> {
    try {
      await keycloak.getRealmRole(name);
      // If we get here, the role already exists in Keycloak.
      // We should fail the operation to prevent divergence.
      throw new Error(`Realm Role '${name}' already exists in Keycloak.`);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // 404 means the role doesn't exist, which is what we want!
        await keycloak.createRealmRole({
          name,
          description: "Managed by HRMS",
        });
        return;
      }
      // Some other Keycloak error occurred
      throw error;
    }
  }

  /**
   * Synchronizes a renamed HRMS System Role to Keycloak.
   */
  static async syncRoleUpdated(
    oldName: string,
    newName: string,
  ): Promise<void> {
    if (oldName === newName) return;

    // Check if the new name is already taken in Keycloak
    try {
      await keycloak.getRealmRole(newName);
      throw new Error(
        `Cannot rename to '${newName}' because a Realm Role with that name already exists in Keycloak.`,
      );
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // Good, the new name is available.
        // Now rename the old role.
        await keycloak.updateRealmRole(oldName, {
          name: newName,
          description: "Managed by HRMS",
        });
        return;
      }
      throw error;
    }
  }

  /**
   * Synchronizes a deleted (soft deleted) HRMS System Role by physically removing it from Keycloak.
   * Validates that no users are currently assigned to the role before deletion.
   */
  static async syncRoleDeleted(name: string): Promise<void> {
    try {
      // First, ensure no users are assigned to this role
      const users = await keycloak.getRoleUsers(name);
      if (users && users.length > 0) {
        throw new Error(
          `Cannot delete Realm Role '${name}' because it is still assigned to ${users.length} user(s) in Keycloak.`,
        );
      }

      await keycloak.deleteRealmRole(name);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // Already deleted from Keycloak, so we are in sync!
        return;
      }
      throw error;
    }
  }
}
