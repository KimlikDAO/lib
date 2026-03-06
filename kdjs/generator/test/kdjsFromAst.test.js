import { describe, expect, test } from "bun:test";
import { TsParser } from "../../parser/tsParser";
import { Modifier } from "../../types/modifier";
import { generate } from "../kdjsFromAst";

describe("VariableDeclaration", () => {
  test("generate type string[] from parsed AST", () => {
    const ast = TsParser.parse('let x: number = 1, y: string = "1";');
    const decl = ast.body[0];
    const typeNode = decl;
    expect(generate(typeNode)).toBe(
      "/** @type {number} */\nlet x = 1;\n/** @type {string} */\nlet y = \"1\";"
    );
  });

  test("all untyped declarators on one line", () => {
    const ast = TsParser.parse('const a = 1, b = 2;');
    expect(generate(ast.body[0])).toBe("const a = 1, b = 2;");
  });

  test("mixed typed and untyped: typed one per line, untyped on one line", () => {
    const ast = TsParser.parse('const x: number = 1, y = 2;');
    expect(generate(ast.body[0])).toBe(
      "/** @const {number} */\nconst x = 1;\nconst y = 2;"
    );
  });

  test("single declarator with type", () => {
    const ast = TsParser.parse('const x: number = 1;');
    expect(generate(ast.body[0])).toBe(
      "/** @const {number} */\nconst x = 1;"
    );
  });

  test("single declarator without type", () => {
    const ast = TsParser.parse('const x = 1;');
    expect(generate(ast.body[0])).toBe("const x = 1;");
  });

  test("@define emits /** @define */ before const", () => {
    const ast = TsParser.parse(`/** @define */
const N: bigint = 100n;
`);
    expect(ast.body[0].modifiers).toBe(Modifier.Define);
    expect(generate(ast.body[0])).toBe("/** @define {bigint} */\nconst N = 100n;");
  });

  test("array destructuring", () => {
    const ast = TsParser.parse("const [a,b,c,d] = g;");
    expect(generate(ast.body[0])).toBe("const [a, b, c, d] = g;");
  });
});

describe("Enums", () => {
  test("chains enum", () => {
    const ast = TsParser.parse(`
enum ChainId {
  x1 = "0x1",
  x144 = "0x144",
  x38 = "0x38",
  x406 = "0x406",
  x89 = "0x89",
  xa4b1 = "0xa4b1",
  xa86a = "0xa86a",
  xfa = "0xfa",
  MinaBerkeley = "mina:berkeley",
  MinaMainnet = "mina:mainnet",
  MinaTestnet = "mina:testnet",
}`);
    expect(generate(ast.body[0])).toBe(`
/** @enum {string} */
const ChainId = {
  x1: "0x1",
  x144: "0x144",
  x38: "0x38",
  x406: "0x406",
  x89: "0x89",
  xa4b1: "0xa4b1",
  xa86a: "0xa86a",
  xfa: "0xfa",
  MinaBerkeley: "mina:berkeley",
  MinaMainnet: "mina:mainnet",
  MinaTestnet: "mina:testnet"
};`.slice(1));
  });
});

describe("Arrays", () => {
  test("readonly array", () => {
    const ast = TsParser.parse("const ChainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];");
    expect(generate(ast.body[0])).toBe(
      "/** @const {readonly ChainGroup[]} */\nconst ChainGroups = [ChainGroup.EVM, ChainGroup.MINA];"
    );
  });
});

describe("Interfaces", () => {
  test("Signer interface", () => {
    const ast = TsParser.parse(`
import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: string): Promise<ArrayBuffer>;
  signMessage(message: string, address: string): Promise<Signature>;
}

export { Signature, Signer };
`);
    expect(generate(ast)).toBe(`
import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";
/**
 * @typedef {MinaSignature | EthereumSignature}
 */
const Signature = {};
/**
 * @interface
 */
class Signer {
  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<ArrayBuffer>}
   */
  deriveSecret(message, address) {}
  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<Signature>}
   */
  signMessage(message, address) {}
}

export { Signature, Signer };
`.slice(1));
  });

  test("walletConnector", () => {
    const ast = TsParser.parse(`
import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";

type Provider = MinaProvider | EthereumProvider;

interface WalletConnector extends Signer {
  downloadURL(): string;
  isInitialized(): boolean;
  isChainSupported(chainId: ChainId): boolean;

  setProvider(provider: Provider): void;
  connect(
    chain: ChainId,
    chainChanged: (chainId: ChainId) => void,
    addressChanged: (addresses: string[]) => void,
    onlyIfApproved?: boolean
  ): Promise<void> | void;
  disconnect(): void;
  switchChain(chainId: ChainId): Promise<unknown> | void;
}

export { Provider, WalletConnector };
`);
    expect(generate(ast)).toBe(`
import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";
/**
 * @typedef {MinaProvider | EthereumProvider}
 */
const Provider = {};
/**
 * @interface
 */
class WalletConnector extends Signer {
  /**
   * @return {string}
   */
  downloadURL() {}
  /**
   * @return {boolean}
   */
  isInitialized() {}
  /**
   * @param {ChainId} chainId
   * @return {boolean}
   */
  isChainSupported(chainId) {}
  /**
   * @param {Provider} provider
   * @return {void}
   */
  setProvider(provider) {}
  /**
   * @param {ChainId} chain
   * @param {(chainId: ChainId) => void} chainChanged
   * @param {(addresses: string[]) => void} addressChanged
   * @param {boolean=} onlyIfApproved
   * @return {Promise<void> | void}
   */
  connect(chain, chainChanged, addressChanged, onlyIfApproved) {}
  /**
   * @return {void}
   */
  disconnect() {}
  /**
   * @param {ChainId} chainId
   * @return {Promise<unknown> | void}
   */
  switchChain(chainId) {}
}

export { Provider, WalletConnector };
`.slice(1));
  });

  test("ellipticCurve", () => {
    const ast = TsParser.parse(`
interface Point {
  x: bigint;
  y: bigint;
  z: bigint;

  project(): Point;
  negate(): Point;
  double(): Point;
  increment(other: Point): Point;
  multiply(n: bigint): Point;
  copy(): Point;
}

/**
 * Computes aX + bY at the cost of a single scalar × point multiplication.
 *
 * @pure
 */
const aX_bY = (a: bigint, X: Point, b: bigint, Y: Point): Point => {
  let aBits = a.toString(2);
  let bBits = b.toString(2);
  if (aBits.length > bBits.length)
    bBits = bBits.padStart(aBits.length, "0");
  else if (bBits.length > aBits.length)
    aBits = aBits.padStart(bBits.length, "0");

  const O = X.copy().multiply(0n);
  const d: readonly Point[] = [O, X, Y, X.copy().increment(Y)];
  let R = d[(aBits.charCodeAt(0) - 48) + 2 * (bBits.charCodeAt(0) - 48)].copy();
  for (let i = 1; i < aBits.length; ++i) {
    R.double();
    R.increment(d[(aBits.charCodeAt(i) - 48) + 2 * (bBits.charCodeAt(i) - 48)]);
  }
  return R;
}

export { aX_bY, Point };
`);
    expect(generate(ast)).toBe(`
/**
 * @interface
 */
class Point {
  constructor() {
    /** @type {bigint} */
    this.x;
    /** @type {bigint} */
    this.y;
    /** @type {bigint} */
    this.z;
  }
  /**
   * @return {Point}
   */
  project() {}
  /**
   * @return {Point}
   */
  negate() {}
  /**
   * @return {Point}
   */
  double() {}
  /**
   * @param {Point} other
   * @return {Point}
   */
  increment(other) {}
  /**
   * @param {bigint} n
   * @return {Point}
   */
  multiply(n) {}
  /**
   * @return {Point}
   */
  copy() {}
}
/**
 * @nosideeffects
 * @pureOrBreakMyCode
 * @param {bigint} a
 * @param {Point} X
 * @param {bigint} b
 * @param {Point} Y
 * @return {Point}
 */
const aX_bY = (a, X, b, Y) => {
  let aBits = a.toString(2);
  let bBits = b.toString(2);
  if ((aBits.length > bBits.length))
    bBits = bBits.padStart(aBits.length, "0");
  else if ((bBits.length > aBits.length))
    aBits = aBits.padStart(bBits.length, "0");
  const O = X.copy().multiply(0n);
  /** @const {readonly Point[]} */
  const d = [O, X, Y, X.copy().increment(Y)];
  let R = d[((aBits.charCodeAt(0) - 48) + (2 * (bBits.charCodeAt(0) - 48)))].copy();
  for (let i = 1; (i < aBits.length); ++i) {
    R.double();
    R.increment(d[((aBits.charCodeAt(i) - 48) + (2 * (bBits.charCodeAt(i) - 48)))]);
  }
  return R;
};

export { aX_bY, Point };
`.slice(1));
  })
});

describe("Functions", () => {
  test("", () => {
    const ast = TsParser.parse("const chainIdToGroup = (id: ChainId): ChainGroup => id.slice(0, 2) as ChainGroup;");
    expect(generate(ast.body[0]))
      .toInclude("const chainIdToGroup = (id) => /** @type {ChainGroup} */(id.slice(0, 2))");
  });
});

test("generate type bigint | number from parsed AST", () => {
  const ast = TsParser.parse('let x: bigint | number | "LARGESTNUMBER"');
  const decl = ast.body[0].declarations[0];
  const typeNode = decl.id.typeAnnotation.typeAnnotation;
  expect(generate(typeNode)).toBe("bigint | number | string");
});

test("generate type (this:User, a: bigint) => bigint from parsed AST", () => {
  const ast = TsParser.parse('let f: (this:User, a: bigint) => string');
  const decl = ast.body[0].declarations[0];
  const typeNode = decl.id.typeAnnotation.typeAnnotation;
  expect(generate(typeNode)).toBe("(this: User, a: bigint) => string");
});

test("ClassDeclaration", () => {
  const input = `
import { Address } from "./address.d";
import { EIP712TypedData } from "./contract/EIP712.d";
import { RequestArguments } from "./provider.d";
import { WideSignature } from "./signature.d";
import { serialize, TransactionRequest } from "./transaction";
import { TransactionHash } from "./transaction.d";

interface Provider {
  read(txRequest: TransactionRequest): Promise<string>;
  write(txRequest: TransactionRequest): Promise<TransactionHash>;
  whenWritten(txHash: TransactionHash, then: () => void): void;
  signData(address: Address, typedData: EIP712TypedData): Promise<WideSignature>;
}

class RemoteProvider implements Provider {
  constructor(
    readonly request: (params: RequestArguments) => Promise<unknown>
  ) {}

  read(txRequest: TransactionRequest): Promise<string> {
    const tx = serialize(txRequest);
    return this.request({
      method: "eth_call",
      params: [tx, "latest"]
    } as RequestArguments) as Promise<string>;
  }

  write(txRequest: TransactionRequest): Promise<TransactionHash> {
    const tx = serialize(txRequest);
    return this.request({
      method: "eth_sendTransaction",
      params: [tx]
    } as RequestArguments) as Promise<TransactionHash>;
  }

  whenWritten(txHash: TransactionHash, then: () => void): void {
    const interval = setInterval(() =>
      this.request({
        method: "eth_getTransactionReceipt",
        params: [txHash]
      } as RequestArguments
      ).then((receipt) => {
        if (receipt) {
          clearInterval(interval);
          then();
        }
      }),
      1000);
  }

  signData(address: Address, typedData: EIP712TypedData): Promise<WideSignature> {
    return this.request({
      method: "eth_signTypedData_v4",
      params: [address, JSON.stringify(typedData)]
    } as RequestArguments) as Promise<WideSignature>;
  }
}

export { Provider, RemoteProvider };
`;
  const ast = TsParser.parse(input);
  expect(generate(ast)).toBe(`
import { Address } from "./address.d";
import { EIP712TypedData } from "./contract/EIP712.d";
import { RequestArguments } from "./provider.d";
import { WideSignature } from "./signature.d";
import { serialize, TransactionRequest } from "./transaction";
import { TransactionHash } from "./transaction.d";
/**
 * @interface
 */
class Provider {
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<string>}
   */
  read(txRequest) {}
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<TransactionHash>}
   */
  write(txRequest) {}
  /**
   * @param {TransactionHash} txHash
   * @param {() => void} then
   * @return {void}
   */
  whenWritten(txHash, then) {}
  /**
   * @param {Address} address
   * @param {EIP712TypedData} typedData
   * @return {Promise<WideSignature>}
   */
  signData(address, typedData) {}
}
/**
 * @implements {Provider}
 */
class RemoteProvider {
  /**
   * @param {(params: RequestArguments) => Promise<unknown>} request
   * @return {void}
   */
  constructor(request) {
    /** @const {(params: RequestArguments) => Promise<unknown>} */
    this.request = request;
  }
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<string>}
   */
  read(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<string>} */(this.request(/** @type {RequestArguments} */({
      method: "eth_call",
      params: [tx, "latest"]
    })));
  }
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<TransactionHash>}
   */
  write(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<TransactionHash>} */(this.request(/** @type {RequestArguments} */({
      method: "eth_sendTransaction",
      params: [tx]
    })));
  }
  /**
   * @param {TransactionHash} txHash
   * @param {() => void} then
   * @return {void}
   */
  whenWritten(txHash, then) {
    const interval = setInterval(() => this.request(/** @type {RequestArguments} */({
      method: "eth_getTransactionReceipt",
      params: [txHash]
    })).then((receipt) => {
      if (receipt) {
        clearInterval(interval);
        then();
      }
    }), 1000);
  }
  /**
   * @param {Address} address
   * @param {EIP712TypedData} typedData
   * @return {Promise<WideSignature>}
   */
  signData(address, typedData) {
    return /** @type {Promise<WideSignature>} */(this.request(/** @type {RequestArguments} */({
      method: "eth_signTypedData_v4",
      params: [address, JSON.stringify(typedData)]
    })));
  }
}

export { Provider, RemoteProvider };
`.slice(1));
});

test("while statement", () => {
  const ast = TsParser.parse(`
/** @noinline */
let i: number = 0;
while (i < 3) {
  i++;
}
`);
  expect(generate(ast)).toBe(`
/**
 * @noinline
 * @type {number}
 */
let i = 0;
while ((i < 3)) {
  i++;
}
`.slice(1));
});
