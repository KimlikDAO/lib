import { expect, test } from "bun:test";
import { generateClassInterface, generateEnum, generatePrototypeInterface } from "../closureFromAst";

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
