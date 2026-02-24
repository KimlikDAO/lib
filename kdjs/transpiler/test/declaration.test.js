import { describe, expect, it, test } from "bun:test";
import { pathToNamespace, transpileDeclaration as transpile } from "../declaration";

test("pathToNamespace should convert file paths to namespace names", () => {
  expect(pathToNamespace("api/jsonrpc.d.ts")).toBe("namespace$$api$jsonrpc");
  expect(pathToNamespace("ethereum/provider.d.ts")).toBe("namespace$$ethereum$provider");
  expect(pathToNamespace("lib/mina/provider.d.ts")).toBe("namespace$$lib$mina$provider");
});

describe("typedefs", () => {
  it("handles simple typedefs", () => {
    const input = `
type Address = string;
export { Address };
`
    const expected = `/** @externs */
/** @const */
const namespace$$address = {};

/** @typedef {string} */
namespace$$address.Address;

`;
  const result = transpile(input, "address.d.ts");
  expect(result).toBe(expected);
  });

  it("promotes literal types to containing type", () => {
    const input = `
type Color = "red" | "green" | "blue";
export { Color };
`
    const expected = `/** @externs */
/** @const */
const namespace$$color = {};

/** @typedef {string|string|string} */
namespace$$color.Color;

`;
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

  // Expected output in Google Closure Compiler format
  const expected = `/** @externs */
/** @const */
const namespace$$api$jsonrpc = {};

/**
 * @struct
 * @interface
 */
namespace$$api$jsonrpc.Request = function () {};

/** @const {string} */
namespace$$api$jsonrpc.Request.prototype.jsonrpc;

/** @const {string} */
namespace$$api$jsonrpc.Request.prototype.method;

/** @const {unknown[]} */
namespace$$api$jsonrpc.Request.prototype.params;

/** @const {number|string} */
namespace$$api$jsonrpc.Request.prototype.id;

/**
 * @struct
 * @interface
 */
namespace$$api$jsonrpc.Response = function () {};

/** @const {string} */
namespace$$api$jsonrpc.Response.prototype.jsonrpc;

/** @const {unknown} */
namespace$$api$jsonrpc.Response.prototype.result;

/** @const {unknown} */
namespace$$api$jsonrpc.Response.prototype.error;

/** @const {number|string} */
namespace$$api$jsonrpc.Response.prototype.id;

`;

  const result = transpile(input, "api/jsonrpc.d.ts");
  expect(result).toBe(expected);
});

test("should handle imports and type references", () => {
  // Input TypeScript with imports
  const input = `
import { User } from "../auth/auth.d.ts";
import eth from "../ethereum/provider.d.ts";

interface ApiClient {
  authenticate(token: string): Promise<User>;
  sendTransaction(tx: eth.Transaction): Promise<string>;
}

export { ApiClient };
`;

  // Expected output with imports properly resolved
  const expected = `/** @externs */
import "../auth/auth.d.ts";
import "../ethereum/provider.d.ts";
/** @const */
const namespace$$api$client = {};

/**
 * @struct
 * @interface
 */
namespace$$api$client.ApiClient = function () {};

/**
 * @param {string} token
 * @return {Promise<namespace$$auth$auth.User>}
 */
namespace$$api$client.ApiClient.prototype.authenticate = function (token) {};

/**
 * @param {namespace$$ethereum$provider.Transaction} tx
 * @return {Promise<string>}
 */
namespace$$api$client.ApiClient.prototype.sendTransaction = function (tx) {};

`;

  const result = transpile(input, "api/client.d.ts");
  expect(result).toBe(expected);
});

test("should handle interface extensions", () => {
  // Input TypeScript with interface extension
  const input = `
import { BaseProvider } from "../api/provider.d.ts";

interface ExtendedProvider extends BaseProvider {
  additionalMethod(): void;
  additionalProperty: string;
}

export { ExtendedProvider };
`;

  // Expected output with extension
  const expected = `/** @externs */
import "../api/provider.d.ts";
/** @const */
const namespace$$test$provider = {};

/**
 * @struct
 * @interface
 * @extends {namespace$$api$provider.BaseProvider}
 */
namespace$$test$provider.ExtendedProvider = function () {};

/**
 * @return {void}
 */
namespace$$test$provider.ExtendedProvider.prototype.additionalMethod = function () {};

/** @type {string} */
namespace$$test$provider.ExtendedProvider.prototype.additionalProperty;

`;

  const result = transpile(input, "test/provider.d.ts");
  expect(result).toBe(expected);
});

test("type alias (readonly T[])[] emits parenthesized readonly in typedef", () => {
  const result = transpile("type A = (readonly bigint[])[];", "test/types.d.ts");
  console.log(result);
  expect(result).toContain("@typedef {(readonly bigint[])[]}");
  expect(result).toContain("namespace$$test$types.A");
});
