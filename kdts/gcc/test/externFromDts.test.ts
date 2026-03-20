import { describe, expect, it, test } from "bun:test";
import {
  pathToNamespace,
  transpileDts as transpile
} from "../externFromDts";

test("pathToNamespace should convert file paths to namespace names", () => {
  expect(pathToNamespace("api/jsonrpc.d.ts")).toBe("kdts$$api$jsonrpc");
  expect(pathToNamespace("ethereum/provider.d.ts")).toBe("kdts$$ethereum$provider");
  expect(pathToNamespace("lib/mina/provider.d.ts")).toBe("kdts$$lib$mina$provider");
});

describe("typedefs", () => {
  it("handles simple typedefs", () => {
    const input = `
type Address = string;
export { Address };
`
    const expected = `
/** @fileoverview @externs */
/**
 * @typedef {string}
 */
const kdts$$address$Address = {};
`.slice(1);
  const result = transpile(input, "address.d.ts");
  expect(result).toBe(expected);
  });

  it("promotes literal types to containing type", () => {
    const input = `
type Color = "red" | "green" | "blue";
export { Color };
`
    const expected = `
/** @fileoverview @externs */
/**
 * @typedef {string | string | string}
 */
const kdts$$color$Color = {};
`.slice(1);
    const result = transpile(input, "color.d.ts");
    expect(result).toBe(expected);
  });
}); 

test("should transpile a simple interface", () => {
  // Input TypeScript declaration
  const input = `
interface Request {
  readonly jsonrpc: string;
  readonly method: string;
  readonly params: unknown[];
  readonly id: number | string;
}

interface Response {
  readonly jsonrpc: string;
  readonly result: unknown;
  readonly error: unknown;
  readonly id: number | string;
}

export default { Request, Response };
`;

  const result = transpile(input, "api/jsonrpc.d.ts");
  expect(result).toBe(`
/** @fileoverview @externs */
/**
 * @interface
 */
class kdts$$api$jsonrpc$Request {
  constructor() {
    /** @const {string} */
    this.jsonrpc;
    /** @const {string} */
    this.method;
    /** @const {unknown[]} */
    this.params;
    /** @const {number | string} */
    this.id;
  }
}
/**
 * @interface
 */
class kdts$$api$jsonrpc$Response {
  constructor() {
    /** @const {string} */
    this.jsonrpc;
    /** @const {unknown} */
    this.result;
    /** @const {unknown} */
    this.error;
    /** @const {number | string} */
    this.id;
  }
}
`.slice(1))
});

test("should handle imports and type references", () => {
  const input = `
import { User } from "../auth/auth.d.ts";
import eth from "../ethereum/provider.d.ts";

interface ApiClient {
  authenticate(token: string): Promise<User>;
  sendTransaction(tx: eth.Transaction): Promise<string>;
}

export { ApiClient };
`;

  const result = transpile(input, "api/client.d.ts");
  expect(result).toBe(`
/** @fileoverview @externs */
import "../auth/auth.d.ts"; // kdts-djs: imports are for dependency crawling
import "../ethereum/provider.d.ts"; // kdts-djs: imports are for dependency crawling
/**
 * @interface
 */
class kdts$$api$client$ApiClient {
  /**
   * @param {string} token
   * @return {Promise<kdts$$auth$auth$User>}
   */
  authenticate(token) {}
  /**
   * @param {kdts$$ethereum$provider.Transaction} tx
   * @return {Promise<string>}
   */
  sendTransaction(tx) {}
}
`.slice(1));
});

test("should handle interface extensions", () => {
  const input = `
import { BaseProvider } from "../api/provider.d.ts";

interface ExtendedProvider extends BaseProvider {
  additionalMethod(): void;
  additionalProperty: string;
}

export { ExtendedProvider };
`;

  const result = transpile(input, "test/provider.d.ts");
  expect(result).toBe(`
/** @fileoverview @externs */
import "../api/provider.d.ts"; // kdts-djs: imports are for dependency crawling
/**
 * @interface
 * @extends {kdts$$api$provider$BaseProvider}
 */
class kdts$$test$provider$ExtendedProvider {
  constructor() {
    /** @type {string} */
    this.additionalProperty;
  }
  /**
   * @return {void}
   */
  additionalMethod() {}
}
`.slice(1));
});

test("type alias (readonly T[])[] emits parenthesized readonly in typedef", () => {
  const result = transpile("type A = (readonly bigint[])[];", "test/types.d.ts");
  expect(result).toContain("@typedef {(readonly bigint[])[]}");
  expect(result).toContain("kdts$$test$types$A");
});

test("moduleWorker.d.ts - log output", () => {
  const input = `
class CfRequest extends Request {
  cf: { clientAcceptEncoding?: string }
}

interface Env {};

interface ModuleWorker {
  fetch(req: CfRequest, env?: Env): Promise<Response> | Response;
}

export { CfRequest, ModuleWorker, Env };
`;
  const result = transpile(input, "moduleWorker.d.ts");
  expect(result).toBe(`
/** @fileoverview @externs */
class kdts$$moduleWorker$CfRequest extends Request {
  constructor() {
    /** @type {{
      clientAcceptEncoding?: string
    }} */
    this.cf;
  }
}
/**
 * @interface
 */
class kdts$$moduleWorker$Env {
}
/**
 * @interface
 */
class kdts$$moduleWorker$ModuleWorker {
  /**
   * @param {kdts$$moduleWorker$CfRequest} req
   * @param {kdts$$moduleWorker$Env=} env
   * @return {Promise<Response> | Response}
   */
  fetch(req, env) {}
}
`.slice(1));
});
