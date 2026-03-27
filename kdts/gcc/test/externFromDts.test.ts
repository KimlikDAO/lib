import { describe, expect, it, test } from "bun:test";
import { afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { SourceSet } from "../../frontend/sourceSet";
import { transpileDts } from "../externFromDts";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

const transpile = (content: string, path: string): string =>
  transpileDts(
    { path, source: "module:address.d" },
    content,
    new SourceSet()
  );

const transpileWithSources = (
  content: string,
  path: string,
  files: Record<string, string> = {}
): { output: string, sources: SourceSet } => {
  const cwd = mkdtempSync(join(tmpdir(), "kdts-extern-"));
  process.chdir(cwd);

  for (const filePath in files) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, files[filePath]!);
  }

  const sources = new SourceSet();
  return {
    output: transpileDts(
      { path, source: "module:api/client.d" },
      content,
      sources
    ),
    sources
  };
};

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
const kdts$$module$address_d$Address = {};

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
 * @typedef {string}
 */
const kdts$$module$address_d$Color = {};

`.slice(1);
    const result = transpile(input, "color.d.ts");
    expect(result).toBe(expected);
  });

  it("transpiles generated typedef jsdocs through Closure syntax", () => {
    const input = `
type StringMap = Record<string, string>;
export { StringMap };
`;
    const result = transpile(input, "string_map.d.ts");
    expect(result).toContain("@typedef {!Object<string,string>}");
  });
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

  const { output, sources } = transpileWithSources(input, "api/client.d.ts", {
    "auth/auth.d.ts": "",
    "ethereum/provider.d.ts": ""
  });
  expect(output).toBe(`
/** @fileoverview @externs */
/**
 * @interface
 */
class kdts$$module$api$client_d$ApiClient {
  /**
   * @param {string} token
   * @return {!Promise<!kdts$$module$auth$auth_d$User>}
   */
  authenticate(token) {}
  /**
   * @param {!kdts$$module$ethereum$provider_d$undefined.Transaction} tx
   * @return {!Promise<string>}
   */
  sendTransaction(tx) {}
}

`.slice(1));
  expect(sources.getPaths()).toEqual(["auth/auth.d.ts", "ethereum/provider.d.ts"]);
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

  const { output, sources } = transpileWithSources(input, "test/provider.d.ts", {
    "api/provider.d.ts": ""
  });
  expect(output).toBe(`
/** @fileoverview @externs */
/**
 * @interface
 * @extends {kdts$$module$api$provider_d$BaseProvider}
 */
class kdts$$module$api$client_d$ExtendedProvider {
  constructor() {
    /** @type {string} */
    this.additionalProperty;
  }
  /**
   * @return {undefined}
   */
  additionalMethod() {}
}

`.slice(1));
  expect(sources.getPaths()).toEqual(["api/provider.d.ts"]);
});

test("type alias (readonly T[])[] emits Closure readonly array typedef", () => {
  const result = transpile("type A = (readonly bigint[])[];", "test/types.d.ts");
  expect(result).toContain("@typedef {!Array<!ReadonlyArray<bigint>>}");
  expect(result).toContain("kdts$$module$address_d$A");
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
class kdts$$module$address_d$CfRequest extends Request {
  constructor() {
    /** @type {{ clientAcceptEncoding: (string|undefined) }} */
    this.cf;
  }
}
/**
 * @interface
 */
class kdts$$module$address_d$Env {
}

/**
 * @interface
 */
class kdts$$module$address_d$ModuleWorker {
  /**
   * @param {!kdts$$module$address_d$CfRequest} req
   * @param {!kdts$$module$address_d$Env=} env
   * @return {!Promise<!Response>|!Response}
   */
  fetch(req, env) {}
}

`.slice(1));
});

test("import aliases bind to the exported source name", () => {
  const input = `
import { B as C } from "b";

interface A extends C {}

export { A };
`;

  const { output, sources } = transpileWithSources(input, "a.d.ts", {
    "node_modules/@kimlikdao/kdts/@types/b.d.ts": ""
  });
  expect(output).toBe(`
/** @fileoverview @externs */
/**
 * @interface
 * @extends {kdts$$package$b$B}
 */
class kdts$$module$api$client_d$A {
}

`.slice(1));
  expect(sources.getPaths()).toEqual(["node_modules/@kimlikdao/kdts/@types/b.d.ts"]);
});
