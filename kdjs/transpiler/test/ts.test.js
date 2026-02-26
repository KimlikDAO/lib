import { expect, test } from "bun:test";
import { transpileTs } from "../ts";

test("enums and variables", () => {
  const input = `
const enum ChainId {
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

const enum ChainGroup {
  EVM = "0x",
  MINA = "mi",
}

const ChainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];

const chainIdToGroup = (id: ChainId): ChainGroup => (id.slice(0, 2) as ChainGroup);

export { ChainId, ChainGroup, ChainGroups, chainIdToGroup };
`;
  const result = transpileTs(input);
  expect(result).toBe(
`/** @enum {string} */
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
`);
});

test("crosschain walletConnector", () => {
  const input =
`import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
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
  expect(transpileTs(input)).toBe(
`import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";

/** @typedef {MinaProvider|EthereumProvider} */
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
   * @return {Promise<void>|void}
   */
  connect(chain, chainChanged, addressChanged, onlyIfApproved) {}
  /**
   * @return {void}
   */
  disconnect() {}
  /**
   * @param {ChainId} chainId
   * @return {Promise<unknown>|void}
   */
  switchChain(chainId) {}
  /**
   * @param {ChainId} chainId
   * @return {boolean}
   */
  isChainSupported(chainId) {}
}

export {
  Provider,
  WalletConnector
};
`);
});

test("crosschain signer", () => {
  const input = `import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: string): Promise<ArrayBuffer>;
  signMessage(message: string, address: string): Promise<Signature>;
}

export { Signature, Signer };
`;
  expect(transpileTs(input)).toBe(
`import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

/** @typedef {MinaSignature|EthereumSignature} */
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

export {
  Signature,
  Signer
};
`);
});
