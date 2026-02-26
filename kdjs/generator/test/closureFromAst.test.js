import { expect, test } from "bun:test";
import {
  generateClassInterface,
  generateEnum,
  generateImport,
  generatePrototypeInterface
} from "../closureFromAst";

test("generateImport default import emits default syntax", () => {
  const node = {
    specifiers: [{ type: "ImportDefaultSpecifier", local: { name: "abi" } }],
    source: { value: "../abi" }
  };
  expect(generateImport(node)).toBe('import abi from "../abi";\n');
});

test("generateImport named imports emit brace syntax", () => {
  const node = {
    specifiers: [
      { type: "ImportSpecifier", imported: { name: "foo" }, local: { name: "foo" } },
      { type: "ImportSpecifier", imported: { name: "Bar" }, local: { name: "Bar" } }
    ],
    source: { value: "./mod" }
  };
  expect(generateImport(node)).toBe('import { foo, Bar } from "./mod";\n');
});

test("generateImport default and named emits both", () => {
  const node = {
    specifiers: [
      { type: "ImportDefaultSpecifier", local: { name: "abi" } },
      { type: "ImportSpecifier", imported: { name: "helper" }, local: { name: "helper" } }
    ],
    source: { value: "../abi" }
  };
  expect(generateImport(node)).toBe('import abi, { helper } from "../abi";\n');
});

test("generateImport namespace import", () => {
  const node = {
    specifiers: [{ type: "ImportNamespaceSpecifier", local: { name: "ns" } }],
    source: { value: "./mod" }
  };
  expect(generateImport(node)).toBe('import * as ns from "./mod";\n');
});

test("generateImport side-effect only", () => {
  const node = { specifiers: [], source: { value: "./sideeffect" } };
  expect(generateImport(node)).toBe('import "./sideeffect";\n');
});

test("generateEnum emits number enum with namespace", () => {
  const node = {
    id: { name: "Status" },
    members: [
      { id: { name: "Ok" }, initializer: { value: 0 } },
      { id: { name: "Err" }, initializer: { value: 1 } },
    ],
  };
  const typeMap = new Map([["Status", "ns$$foo.Status"]]);
  const out = generateEnum(node, typeMap);
  expect(out).toBe(
    `/** @enum {number} */
ns$$foo.Status = {
  Ok: 0,
  Err: 1
};
`,
  );
});

test("generatePrototypeInterface emits GCC interface with prototype members", () => {
  const node = {
    id: { name: "Signer" },
    extends: [],
    body: {
      body: [
        {
          type: "TSPropertySignature",
          key: { name: "address" },
          optional: false,
          readonly: true,
          typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
        },
        {
          type: "TSMethodSignature",
          key: { name: "sign" },
          parameters: [
            {
              name: { name: "msg" },
              optional: false,
              typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
            },
          ],
          typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
        },
      ],
    },
  };
  const typeMap = new Map([["Signer", "ns$$chain.Signer"]]);
  const out = generatePrototypeInterface(node, typeMap);
  expect(out).toBe(
    `/**
 * @struct
 * @interface
 */
ns$$chain.Signer = function () {};

/** @const {string} */
ns$$chain.Signer.prototype.address;

/**
 * @param {string} msg
 * @return {string}
 */
ns$$chain.Signer.prototype.sign = function (msg) {};

`,
  );
});

test("generateEnum emits string enum and infers @enum {string}", () => {
  const node = {
    id: { name: "Kind" },
    members: [
      { id: { name: "A" }, initializer: { value: "a" } },
      { id: { name: "B" }, initializer: { value: "b" } },
    ],
  };
  const out = generateEnum(node);
  expect(out).toContain("/** @enum {string} */");
  expect(out).toContain('A: "a"');
  expect(out).toContain('B: "b"');
  expect(out).toContain("const Kind = {");
});

const signerNode = {
  id: { name: "Signer" },
  extends: [],
  body: {
    body: [
      {
        type: "TSPropertySignature",
        key: { name: "address" },
        optional: false,
        readonly: true,
        typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
      },
      {
        type: "TSMethodSignature",
        key: { name: "sign" },
        parameters: [
          {
            name: { name: "msg" },
            optional: false,
            typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
          },
        ],
        typeAnnotation: { typeAnnotation: { type: "TSStringKeyword" } },
      },
    ],
  },
};

test("generateClassInterface emits class-syntax GCC interface", () => {
  const typeMap = new Map([["Signer", "ns$$chain.Signer"]]);
  const out = generateClassInterface(signerNode, typeMap);
  expect(out).toBe(
    `/**
 * @interface
 */
ns$$chain.Signer = class {
  constructor() {
    /** @const {string} */
    this.address;
  }
  /**
   * @param {string} msg
   * @return {string}
   */
  sign(msg) {}
}
`,
  );
});

test("generateClassInterface puts first extends on class, extra as @extends JSDoc", () => {
  const node = {
    ...signerNode,
    extends: [
      { expression: { type: "Identifier", name: "HasAddress" } },
      { expression: { type: "Identifier", name: "TypedDataSigner" } },
    ],
  };
  const typeMap = new Map([
    ["Signer", "ns$$chain.Signer"],
    ["HasAddress", "ns2$$HasAddress"],
    ["TypedDataSigner", "ns3$$ss.TypedDataSigner"],
  ]);
  const out = generateClassInterface(node, typeMap);
  expect(out).toBe(
    `/**
 * @interface
 * @extends {ns3$$ss.TypedDataSigner}
 */
ns$$chain.Signer = class extends ns2$$HasAddress {
  constructor() {
    /** @const {string} */
    this.address;
  }
  /**
   * @param {string} msg
   * @return {string}
   */
  sign(msg) {}
}
`,
  );
});
