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
  expect(transpileTs(input)).toBe(`
import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
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
`.slice(1));
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
  expect(transpileTs(input)).toBe(`
import { Signature as EthereumSignature } from "../ethereum/signature.d";
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
  constructor(readonly request: (params: RequestArguments) => Promise<unknown>) {
    this.request = request;
  }

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
   * @return {void}
   */
  constructor(request) {
    this.request = request;
  }
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<string>}
   */
  read(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<string>} */(this.request(/** @type {RequestArguments} */({ method: "eth_call", params: [tx, "latest"] })));
  }
  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<TransactionHash>}
   */
  write(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<TransactionHash>} */(this.request(/** @type {RequestArguments} */({ method: "eth_sendTransaction", params: [tx] })));
  }
  /**
   * @param {TransactionHash} txHash
   * @param {() => void} then
   * @return {void}
   */
  whenWritten(txHash, then) {
    const interval = setInterval(() => this.request(/** @type {RequestArguments} */({ method: "eth_getTransactionReceipt", params: [txHash] })).then((receipt) => {
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
    return /** @type {Promise<WideSignature>} */(this.request(/** @type {RequestArguments} */({ method: "eth_signTypedData_v4", params: [address, JSON.stringify(typedData)] })));
  }
}

export {
  Provider,
  RemoteProvider
};
`;

  expect(transpileTs(input)).toBe(expected.slice(1));
});
