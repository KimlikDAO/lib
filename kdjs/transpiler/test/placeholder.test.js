import { describe, expect, it } from "bun:test";
import { generatePlaceholder } from "../declaration";

describe("generatePlaceholder", () => {
  it("should handle named exports", () => {
    const input = `
      interface User {
        name: string;
        age: number;
      }
      
      export { User };
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const User = {};");
  });

  it("should handle default exports with object literal", () => {
    const input = `
      interface Request {
        method: string;
      }

      interface Response {
        status: number;
      }
      
      export default { Request, Response };
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const Request = {};");
    expect(result).toContain("export const Response = {};");
    expect(result).toContain("export default { Request, Response };");
  });

  it("should handle interface declarations", () => {
    const input = `
      interface Config {
        apiKey: string;
        timeout: number;
      }
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const Config = {};");
  });

  it("should handle type aliases", () => {
    const input = `
      type ID = string | number;
      type UserRole = 'admin' | 'user' | 'guest';
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const ID = {};");
    expect(result).toContain("export const UserRole = {};");
  });

  it("should handle direct exports of interfaces and types", () => {
    const input = `
      export interface ApiOptions {
        baseUrl: string;
      }
      
      export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const ApiOptions = {};");
    expect(result).toContain("export const Method = {};");
  });

  it("should handle complex export patterns", () => {
    const input = `
      interface BaseConfig {
        version: string;
      }
      
      interface AdvancedConfig extends BaseConfig {
        features: string[];
      }
      
      type ConfigType = 'basic' | 'advanced';
      
      const DEFAULT_VERSION = '1.0.0';
      
      export { BaseConfig, AdvancedConfig };
      export type { ConfigType };
      export default { BaseConfig, AdvancedConfig, ConfigType };
    `;

    const result = generatePlaceholder(input);
    expect(result).toContain("export const BaseConfig = {};");
    expect(result).toContain("export const AdvancedConfig = {};");
    expect(result).toContain("export const ConfigType = {};");
    expect(result).toContain("export default { BaseConfig, AdvancedConfig, ConfigType };");
  });

  it("crosschain signer.ts", () => {
    const input =
`import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: string): Promise<ArrayBuffer>;
  signMessage(message: string, address: string): Promise<Signature>;
}

export { Signature, Signer };
`;
    expect(generatePlaceholder(input)).toBe(
`export const Signature = {};
export const Signer = {};`);
  });

  it("should handle empty files", () => {
    const input = `
      // Empty declaration file
    `;

    const result = generatePlaceholder(input);
    expect(result).toBe("");
  });
});

