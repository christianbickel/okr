const ADMIN_ROLE_ID = "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y";

/**
 * Default ACL for entries created via service-user API key.
 * Service users must not appear in User-principal security rules
 * (`ServiceUserCanNotBeUsed`).
 */
export async function defaultSecurityRules() {
  return [{ key: { roleId: ADMIN_ROLE_ID }, value: "Manage" as const }];
}
