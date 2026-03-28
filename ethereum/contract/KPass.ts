import abi from "../abi";
import { Address } from "../address.d";
import { ChainId } from "../chains";
import { Provider, RemoteProvider } from "../provider";
import { TransactionHash } from "../transaction.d";
import { Tokens } from "./tokens";

const MILLION = 1_000_000;
const TRILLION = 10n ** 12n;

const maybeGasLimit = (chainId: ChainId, gasLimit: number): number | undefined =>
  chainId == ChainId.xa4b1 ? undefined : gasLimit;

const serializeRevokers = (
  revokeThreshold: number,
  revokers: Record<string, number>,
): string => {
  let ser = "";
  let count = 0;
  for (const address in revokers) {
    if (address == "length") continue;
    count += 1;
    ser += abi.uint96(revokers[address]) + address.slice(2).toLowerCase();
  }
  ser += abi.uint256(0).repeat(5 - count);
  return abi.uint64(revokeThreshold) + ser.slice(16);
};

const KPass = {
  contract: "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc",
  provider: new RemoteProvider(() => Promise.resolve("")) as Provider,

  setProvider(provider: Provider): void {
    KPass.provider = provider;
  },
  handleOf(chainId: ChainId, address: Address): Promise<string> {
    return KPass.provider.read({
      chainId,
      to: KPass.contract,
      data: "0xc50a1514" + abi.address(address),
    });
  },
  revokesRemaining(chainId: ChainId, sender: Address): Promise<number> {
    return KPass.provider.read({
      chainId,
      to: KPass.contract,
      data: "0x165c44f3" + abi.address(sender),
    }).then((revokes) => parseInt(revokes.slice(-6), 16));
  },
  reduceRevokeThreshold(
    chainId: ChainId,
    address: Address,
    deltaWeight: number,
  ): Promise<TransactionHash> {
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      data: "0xab505b1c" + abi.uint256(deltaWeight),
      gas: maybeGasLimit(chainId, 22_000),
    });
  },
  addRevoker(
    chainId: ChainId,
    address: Address,
    deltaWeight: number,
    revokerAddress: Address,
  ): Promise<TransactionHash> {
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      data:
        "0xf02b3297" +
        abi.uint96(deltaWeight) +
        abi.packedAddress(revokerAddress),
      gas: maybeGasLimit(chainId, 49_000),
    });
  },
  revoke(chainId: ChainId, address: Address): Promise<TransactionHash> {
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      data: "0xb6549f75",
      gas: maybeGasLimit(chainId, 53_000),
    });
  },
  revokeFriend(
    chainId: ChainId,
    address: Address,
    friend: Address,
  ): Promise<TransactionHash> {
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      data: "0x3a2c82c7" + abi.address(friend),
      gas: maybeGasLimit(chainId, 80_000),
    });
  },
  createWithRevokers(
    chainId: ChainId,
    address: Address,
    cid: string,
    revokeThreshold: number,
    revokers: Record<string, number>,
  ): Promise<TransactionHash> {
    return KPass.priceIn(chainId, 0).then(([high, low]) => {
      const price =
        TRILLION * BigInt(revokeThreshold == 0 ? high : low);
      const data =
        revokeThreshold == 0
          ? "0x780900dc" + cid
          : "0xd3cfebc1" + cid + serializeRevokers(revokeThreshold, revokers);
      const gas =
        revokeThreshold == 0
          ? maybeGasLimit(chainId, 49_000)
          : maybeGasLimit(
            chainId,
            70_000 + 25_000 * Object.keys(revokers).length,
          );
      return KPass.provider.write({
        chainId,
        to: KPass.contract,
        from: address,
        value: price,
        data,
        gas,
      });
    });
  },
  createWithRevokersWithTokenPermit(
    chainId: ChainId,
    address: Address,
    cid: string,
    revokeThreshold: number,
    revokers: Record<string, number>,
    signature: string,
  ): Promise<TransactionHash> {
    const data =
      revokeThreshold == 0
        ? "0xe0adf95b" + cid + signature
        : "0x0633ddcb" +
        cid +
        serializeRevokers(revokeThreshold, revokers) +
        signature;
    const gas =
      revokeThreshold == 0
        ? maybeGasLimit(chainId, 160_000)
        : maybeGasLimit(
          chainId,
          180_000 + 25_000 * Object.keys(revokers).length,
        );
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      value: 0,
      data,
      gas,
    });
  },
  createWithRevokersWithTokenPayment(
    chainId: ChainId,
    address: Address,
    cid: string,
    revokeThreshold: number,
    revokers: Record<string, number>,
    token: number,
  ): Promise<TransactionHash> {
    const tokenContract = Tokens[chainId][token];
    if (tokenContract == null) throw 0;
    const tokenSerialized =
      abi.uint96(0) + abi.packedAddress(tokenContract.contract);
    const data =
      revokeThreshold == 0
        ? "0xdaca45f7" + cid + tokenSerialized
        : "0x3e36b2f7" +
        cid +
        serializeRevokers(revokeThreshold, revokers) +
        tokenSerialized;
    const gas =
      revokeThreshold == 0
        ? maybeGasLimit(chainId, 140_000)
        : maybeGasLimit(
          chainId,
          160_000 + 25_000 * Object.keys(revokers).length,
        );
    return KPass.provider.write({
      chainId,
      to: KPass.contract,
      from: address,
      value: 0,
      data,
      gas,
    });
  },
  priceIn(chainId: ChainId, token: number): Promise<[number, number]> {
    if (chainId == ChainId.x38 && token == 0)
      return Promise.resolve([5000, 3400]);
    const price: Record<string, number[]> = {
      "0x1": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
      "0xa86a": [50_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
      "0x89": [800_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
      "0xa4b1": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
      "0x38": [3400, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
      "0xfa": [2_300_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
      "0x144": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
    };
    const base = price[chainId][token];
    return Promise.resolve([base * 1.5, base]);
  }
};

export default KPass;
