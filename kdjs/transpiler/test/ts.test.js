import { describe, expect, test } from "bun:test";
import { transpileTs } from "../ts";

test("enums and variables", () => {
  const input = `
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
}

enum ChainGroup {
  EVM = "0x",
  MINA = "mi",
}

const ChainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];

const chainIdToGroup = (id: ChainId): ChainGroup => (id.slice(0, 2) as ChainGroup);

export { ChainId, ChainGroup, ChainGroups, chainIdToGroup };
`;
  const result = transpileTs(input);
  expect(result).toBe(`
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
};
/** @enum {string} */
const ChainGroup = {
  EVM: "0x",
  MINA: "mi"
};
/** @const {readonly ChainGroup[]} */
const ChainGroups = [ChainGroup.EVM, ChainGroup.MINA];
/**
 * @param {ChainId} id
 * @return {ChainGroup}
 */
const chainIdToGroup = (id) => /** @type {ChainGroup} */(id.slice(0, 2));

export {
  ChainId,
  ChainGroup,
  ChainGroups,
  chainIdToGroup
};
`.slice(1));
});

test("arrow function returns object expression", () => {
  const input = `
const f = (x: number) => ({ key: x });
`;
  expect(transpileTs(input)).toBe(`
/**
 * @param {number} x
 */
const f = (x) => ({
  key: x
});
`.slice(1));
});

test("crosschain walletConnector", () => {
  const input = `
import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";

type Provider = MinaProvider | EthereumProvider;

interface WalletConnector extends Signer {
  isInitialized(): boolean;
  setProvider(provider: Provider): void;
  downloadURL(): string;
  connect(
    chain: ChainId,
    chainChanged: (chainId: ChainId) => void,
    addressChanged: (addresses: string[]) => void,
    onlyIfApproved?: boolean
  ): Promise<void> | void;
  disconnect(): void;
  switchChain(chainId: ChainId): Promise<unknown> | void;
  isChainSupported(chainId: ChainId): boolean;
}

export { Provider, WalletConnector };
`;
  expect(transpileTs(input)).toBe(`
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
   * @return {boolean}
   */
  isInitialized() {}
  /**
   * @param {Provider} provider
   * @return {void}
   */
  setProvider(provider) {}
  /**
   * @return {string}
   */
  downloadURL() {}
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
  /**
   * @param {ChainId} chainId
   * @return {boolean}
   */
  isChainSupported(chainId) {}
}

export { Provider, WalletConnector };
`.slice(1));
});

test("crosschain signer", () => {
  const input = `
import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";
type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: string): Promise<ArrayBuffer>;
  signMessage(message: string, address: string): Promise<Signature>;
}

export { Signature, Signer };
`;
  expect(transpileTs(input)).toBe(`
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

test("ethereum provider", () => {
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
  constructor(readonly request: (params: RequestArguments) => Promise<unknown>) {}

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
  const expected = `
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
`.slice(1);
  expect(transpileTs(input)).toBe(expected);
});

test("declaration", () => {
  expect(transpileTs("const a: bigint = 1n;"))
    .toBe("/** @const {bigint} */\nconst a = 1n;\n");
  expect(transpileTs("let a: bigint = 1n;"))
    .toBe("/** @type {bigint} */\nlet a = 1n;\n");
});

describe("for loops", () => {
  test("singleton body", () => {
    expect(transpileTs("for (let i = 0; i < 10; ++i)\n  console.log(i);"))
      .toContain(`
for (let i = 0; (i < 10); ++i)
  console.log(i);`.slice(1));
  });
  test("for if-else", () => {
    expect(transpileTs(`
for (let i = 0; i < 10; ++i)
  if (i % 2 == 0)
    console.log(i);
  else
    console.log('done');`))
      .toContain(`
for (let i = 0; (i < 10); ++i)
  if (((i % 2) == 0))
    console.log(i);
  else
    console.log('done');`.slice(1));
  });
  test("for in", () => {
    expect(transpileTs("for (const key in object)\n  console.log(key);"))
      .toContain("for (const key in object)\n  console.log(key);\n");
  });
  test("for of", () => {
    expect(transpileTs("for (const value of array)\n  console.log(value);"))
      .toContain("for (const value of array)\n  console.log(value);\n");
  });
});

test("", () => {
  const input = `
/**
 * @fileoverview A fast and tiny keccak256 implementation using TypedArrays.
 * @author KimlikDAO
 */
import hex from '../util/hex';

/**
 * Computes the keccak256 of an Uint32Array.
 */
const keccak256Uint32 = (words: Uint32Array): Uint32Array => {
  const s: Uint32Array = new Uint32Array(50);
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  let j = 0;
  for (; i < words.length; ++i, ++j)
    s[j] ^= words[i];
  s[j] ^= 1;
  s[33] ^= 1 << 31;
  f(s);
  return s.subarray(0, 8);
}
export { keccak256Uint32 };
`;
  const expected = `import hex from '../util/hex';
/**
 * @param {Uint32Array} words
 * @return {Uint32Array}
 */
const keccak256Uint32 = (words) => {
  /** @const {Uint32Array} */
  const s = new Uint32Array(50);
  let i = 0;
  for (const end = (words.length - 33); (i < end); i += 34) {
    for (let j = 0; (j < 34); ++j)
      s[j] ^= words[(i + j)];
    f(s);
  }
  let j = 0;
  for (; (i < words.length); ++i, ++j)
    s[j] ^= words[i];
  s[j] ^= 1;
  s[33] ^= (1 << 31);
  f(s);
  return s.subarray(0, 8);
};

export { keccak256Uint32 };
`;
  expect(transpileTs(input)).toBe(expected);
});

test("destructing assignment", () => {
  const input = "const s = new Uint8Array(8);\nlet [a, b, c, d, e, f, g, h] = s;";
  expect(transpileTs(input)).toContain(input);
});

test("type alias with optional properties", () => {
  const input = `
type TransactionRequest = {
  to?: Address;
  from?: Address;
  value?: number | bigint;
  data?: string;
  chainId?: string;
  gas?: number;
};
`;
  expect(transpileTs(input)).toBe(`
/**
 * @typedef {{
 *   to?: Address,
 *   from?: Address,
 *   value?: number | bigint,
 *   data?: string,
 *   chainId?: string,
 *   gas?: number
 * }}
 */
const TransactionRequest = {};
`.slice(1));
});

test("generic function with tuple return type", () => {
  const input = `
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Splits an array into chunks of size n. */
const chunk = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0) throw 0;
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n)
    result.push(arr.slice(i, i + n));
  return result;
};

const partition = <T>(arr: T[], p: (element: T) => boolean): [T[], T[]] => {
  const pos: T[] = [];
  const neg: T[] = [];
  for (const element of arr)
    (p(element) ? pos : neg).push(element);
  return [pos, neg];
};

export { chunk, partition, shuffle };
`;
  expect(transpileTs(input)).toBe(`
/**
 * @suppress {reportUnknownTypes}
 * @template T
 * @param {T[]} arr
 * @return {T[]}
 */
const shuffle = (arr) => {
  for (let i = (arr.length - 1); (i > 0); --i) {
    const j = ((Math.random() * (i + 1)) | 0);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
/**
 * @suppress {reportUnknownTypes}
 * @template T
 * @param {T[]} arr
 * @param {number} n
 * @return {T[][]}
 */
const chunk = (arr, n) => {
  if ((n <= 0))
    throw 0;
  /** @const {T[][]} */
  const result = [];
  for (let i = 0; (i < arr.length); i += n)
    result.push(arr.slice(i, (i + n)));
  return result;
};
/**
 * @suppress {reportUnknownTypes}
 * @template T
 * @param {T[]} arr
 * @param {(element: T) => boolean} p
 * @return {T[][]}
 */
const partition = (arr, p) => {
  /** @const {T[]} */
  const pos = [];
  /** @const {T[]} */
  const neg = [];
  for (const element of arr)
    (p(element) ? pos : neg).push(element);
  return [pos, neg];
};

export {
  chunk,
  partition,
  shuffle
};
`.slice(1));
});

test("MockSigner class with Signer interface", () => {
  const input = `
import { MockSigner as EvmSigner } from "../../ethereum/mock/signer";
import { addr as minaAddr } from "../../mina/mock/signer";
import { SignerSignature as MinaSignature } from "../../mina/signature.d";
import { signMessage } from "../../mina/signer";
import base58 from "../../util/base58";
import { Signature, Signer } from "../signer";

class MockSigner extends EvmSigner implements Signer {
  constructor(privKey: bigint) {
    super(privKey);
  }

  override deriveSecret(message: string, address: string): Promise<ArrayBuffer> {
    if (address.startsWith("0x"))
      return super.deriveSecret(message, address);

    return this.signMessage(message, address).then((sig) =>
      crypto.subtle.digest(
        "SHA-256",
        base58.toBytes((sig as MinaSignature).signature)
      )
    );
  }

  override signMessage(message: string, address: string): Promise<Signature> {
    if (address.startsWith("0x"))
      return super.signMessage(message, address);

    if (address.startsWith("B62")) {
      const privKey = this.privKey;
      if (address != minaAddr(privKey)) return Promise.reject();
      return Promise.resolve(signMessage(message, privKey));
    }
    return Promise.reject();
  }
}

export { MockSigner };
`;
  expect(transpileTs(input)).toBe(`
import { MockSigner as EvmSigner } from "../../ethereum/mock/signer";
import { addr as minaAddr } from "../../mina/mock/signer";
import { SignerSignature as MinaSignature } from "../../mina/signature.d";
import { signMessage } from "../../mina/signer";
import base58 from "../../util/base58";
import { Signature, Signer } from "../signer";
/**
 * @implements {Signer}
 */
class MockSigner extends EvmSigner {
  /**
   * @param {bigint} privKey
   */
  constructor(privKey) {
    super(privKey);
  }
  /**
   * @override
   * @param {string} message
   * @param {string} address
   * @return {Promise<ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if (address.startsWith("0x"))
      return super.deriveSecret(message, address);
    return this.signMessage(message, address).then((sig) => crypto.subtle.digest("SHA-256", base58.toBytes(/** @type {MinaSignature} */(sig).signature)));
  }
  /**
   * @override
   * @param {string} message
   * @param {string} address
   * @return {Promise<Signature>}
   */
  signMessage(message, address) {
    if (address.startsWith("0x"))
      return super.signMessage(message, address);
    if (address.startsWith("B62")) {
      const privKey = this.privKey;
      if ((address != minaAddr(privKey)))
        return Promise.reject();
      return Promise.resolve(signMessage(message, privKey));
    }
    return Promise.reject();
  }
}

export { MockSigner };
`.slice(1));
});

test("cli", () => {
  const input = `
import { Signature, Signer } from "../../crosschain/signer";
import { inverse } from "../../crypto/modular";
import { G, Point, Q } from "../../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import bigints from "../../util/bigints";
import hex from "../../util/hex";
import abi from "../abi";
import signature, { UnpackedSignature } from "../signature";
import { Signature as EthereumSignature, WideSignature } from "../signature.d";
import { personalDigest } from "../signer";

const addr = (privKey: bigint): string => {
  const { x, y } = G.copy().multiply(privKey).project();
  const buff = hex.toUint8Array(abi.uint256(x) + abi.uint256(y));
  return "0x" + hex.from(new Uint8Array(
    keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 12, 20));
};

/**
 * Deterministically sign a given \`digest\` with the \`privKey\`.
 *
 * Note that derivation of the point is deterministic but non-standard, so
 * the created signature will not match that of the common ethereum wallets.
 *
 * TODO(KimlikDAO-bot): Implement standard deterministic signatures.
 */
const signUnpacked = (digest: bigint, privKey: bigint): UnpackedSignature => {
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, 32, digest);
  bigints.intoBytesBE(bytes, 64, privKey);
  const buff = new Uint32Array(bytes.buffer);

  for (; ; ++buff[0]) {
    const k = BigInt("0x" + keccak256Uint32ToHex(buff));
    if (k <= 0 || Q <= k) continue;
    const K: Point = G.copy().multiply(k).project();
    const r = K.x;
    if (r >= Q) continue;
    let s = (inverse(k, Q) * ((digest + r * privKey) % Q)) % Q;
    if (s == 0n) continue;
    let yParity = !!(K.y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity };
  }
};

const signWide = (digest: bigint, privKey: bigint): WideSignature =>
  signature.toWideFromUnpacked(signUnpacked(digest, privKey));

const sign = (digest: bigint, privKey: bigint): EthereumSignature =>
  signature.fromUnpacked(signUnpacked(digest, privKey));

class MockSigner implements Signer {
  constructor(readonly privKey: bigint) { }

  /**
   * Returns a deterministic but non RFC-6979 compliant signature if the
   * provided address is the signer's address; returns \`Promise.reject()\`
   * otherwise.
   */
  signMessage(message: string, address: string): Promise<Signature> {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + personalDigest(message));
    return Promise.resolve("0x" + sign(digest, this.privKey));
  }

  getAddress(): string {
    return addr(this.privKey);
  }

  deriveSecret(message: string, address: string): Promise<ArrayBuffer> {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + personalDigest(message));
    return crypto.subtle.digest("SHA-256",
      hex.toUint8Array(signWide(digest, this.privKey).slice(2)));
  }
}

export {
  addr,
  MockSigner,
  sign,
  signUnpacked,
  signWide
};
`;
  expect(transpileTs(input)).toBe(`
import { Signature, Signer } from "../../crosschain/signer";
import { inverse } from "../../crypto/modular";
import { G, Point, Q } from "../../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import bigints from "../../util/bigints";
import hex from "../../util/hex";
import abi from "../abi";
import signature, { UnpackedSignature } from "../signature";
import { Signature as EthereumSignature, WideSignature } from "../signature.d";
import { personalDigest } from "../signer";
/**
 * @param {bigint} privKey
 * @return {string}
 */
const addr = (privKey) => {
  const { x, y } = G.copy().multiply(privKey).project();
  const buff = hex.toUint8Array((abi.uint256(x) + abi.uint256(y)));
  return ("0x" + hex.from(new Uint8Array(keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 12, 20)));
};
/**
 * @param {bigint} digest
 * @param {bigint} privKey
 * @return {UnpackedSignature}
 */
const signUnpacked = (digest, privKey) => {
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, 32, digest);
  bigints.intoBytesBE(bytes, 64, privKey);
  const buff = new Uint32Array(bytes.buffer);
  for (; ; ++buff[0]) {
    const k = BigInt(("0x" + keccak256Uint32ToHex(buff)));
    if ((k <= 0) || (Q <= k))
      continue;
    /** @const {Point} */
    const K = G.copy().multiply(k).project();
    const r = K.x;
    if ((r >= Q))
      continue;
    let s = ((inverse(k, Q) * ((digest + (r * privKey)) % Q)) % Q);
    if ((s == 0n))
      continue;
    let yParity = !!(K.y & 1n);
    if ((s > (Q >> 1n))) {
      s = (Q - s);
      yParity = !yParity;
    }
    return {
      r,
      s,
      yParity
    };
  }
};
/**
 * @param {bigint} digest
 * @param {bigint} privKey
 * @return {WideSignature}
 */
const signWide = (digest, privKey) => signature.toWideFromUnpacked(signUnpacked(digest, privKey));
/**
 * @param {bigint} digest
 * @param {bigint} privKey
 * @return {EthereumSignature}
 */
const sign = (digest, privKey) => signature.fromUnpacked(signUnpacked(digest, privKey));
/**
 * @implements {Signer}
 */
class MockSigner {
  /**
   * @param {bigint} privKey
   */
  constructor(privKey) {
    /** @const {bigint} */
    this.privKey = privKey;
  }
  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<Signature>}
   */
  signMessage(message, address) {
    if ((address.toLowerCase() != addr(this.privKey)))
      return Promise.reject();
    const digest = BigInt(("0x" + personalDigest(message)));
    return Promise.resolve(("0x" + sign(digest, this.privKey)));
  }
  /**
   * @return {string}
   */
  getAddress() {
    return addr(this.privKey);
  }
  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if ((address.toLowerCase() != addr(this.privKey)))
      return Promise.reject();
    const digest = BigInt(("0x" + personalDigest(message)));
    return crypto.subtle.digest("SHA-256", hex.toUint8Array(signWide(digest, this.privKey).slice(2)));
  }
}

export {
  addr,
  MockSigner,
  sign,
  signUnpacked,
  signWide
};
`.slice(1));
});

test("function type with optional parameters", () => {
  const input = `
type Curve = new (x: bigint, y: bigint, z?: bigint) => IPoint;
`;
  expect(transpileTs(input)).toBe(`
/**
 * @typedef {new (x: bigint, y: bigint, z?: bigint) => IPoint}
 */
const Curve = {};
`.slice(1));
});

test("generic methods", () => {
  const input = `
class Throttle {
  private readonly queue: Task[] = [];
  private slots: number;

  constructor(maxConcurrent: number) {
    this.slots = maxConcurrent;
  }

  add<T>(promise: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        promise,
        resolve: resolve as (val: unknown | PromiseLike<unknown>) => void,
        reject,
      });
    }) as Promise<T>;
  }
};`;
  expect(transpileTs(input)).toBe(`
class Throttle {
  /** @type {Task[]} */
  queue = [];
  /** @type {number} */
  slots;
  /**
   * @param {number} maxConcurrent
   */
  constructor(maxConcurrent) {
    this.slots = maxConcurrent;
  }
  /**
   * @suppress {reportUnknownTypes}
   * @template T
   * @param {() => Promise<T>} promise
   * @return {Promise<T>}
   */
  add(promise) {
    return /** @type {Promise<T>} */(new Promise((resolve, reject) => {
      this.queue.push({
        promise,
        resolve: /** @type {(val: unknown | PromiseLike<unknown>) => void} */(resolve),
        reject
      });
    }));
  }
}

`.slice(1));
});
