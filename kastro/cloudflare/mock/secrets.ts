import type { Auth } from "../api";

/**
 * Mock Bun secrets for tests. get(options) returns JSON-serialized Auth when name is "CloudflareAuth".
 */
export function createMockSecrets(auth: Auth) {
  return {
    get: async (options: { service: string; name: string }): Promise<string | null> => {
      if (options.name == "CloudflareAuth") return JSON.stringify(auth);
      return null;
    }
  };
}
