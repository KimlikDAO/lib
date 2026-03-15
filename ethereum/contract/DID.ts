import { Address } from "../address.d";
import { ChainId } from "../chains";
import { TransactionHash } from "../transaction.d";

interface Revokable {
  revokesRemaining(chainId: ChainId, sender: Address): Promise<number>;
  reduceRevokeThreshold(
    chainId: ChainId,
    address: Address,
    deltaWeight: number,
  ): Promise<TransactionHash>;
  addRevoker(
    chainId: ChainId,
    address: Address,
    deltaWeight: number,
    revokerAddress: Address,
  ): Promise<TransactionHash>;
  revoke(chainId: ChainId, address: Address): Promise<TransactionHash>;
  revokeFriend(
    chainId: ChainId,
    address: Address,
    friend: Address,
  ): Promise<TransactionHash>;
}

export { Revokable };
