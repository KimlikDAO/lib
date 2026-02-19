import { ChainId } from "../../crosschain/chains";
import abi from "../abi";
import { Address } from "../address.d";
import { Provider } from "../provider";
import signature from "../signature";
import { WideSignature } from "../signature.d";
import { EIP712TypedData } from "./EIP712.d";

class ERC20 {
  /**
   * @param {ChainId} chainId
   * @param {Address} contract
   * @param {number=} decimals
   */
  constructor(chainId, contract, decimals = 6) {
    /** @const {ChainId} */
    this.chainId = chainId;
    /** @const {Address} */
    this.contract = contract;
    /** @const {number} */
    this.decimals = decimals;
  }

  /**
   * @param {Provider} provider
   * @param {Address} owner
   * @param {Address} spender
   * @return {Promise<string>}
   */
  allowance(provider, owner, spender) {
    return provider.read({
      chainId: this.chainId,
      to: this.contract,
      data: "0xdd62ed3e" + abi.address(owner) + abi.address(spender)
    });
  }

  /**
   * @param {Provider} provider
   * @param {Address} spender
   * @param {bigint=} amount
   * @return {Promise<string>}
   */
  approve(provider, spender, amount = 0n) {
    return provider.write({
      chainId: this.chainId,
      to: this.contract,
      data: "0x095ea7b3" + abi.address(spender)
        + (amount ? abi.uint256(amount) : abi.Uint256Max)
    });
  }
}

/**
 * 3x256 bit packed permit data.
 * 96 bits: deadline
 * 160 bits: token address
 * 512 bits: {@link Signature}
 *
 * @typedef {string}
 */
const PermitData = {};

class ERC20Permit extends ERC20 {
  /**
   * @param {ChainId} chainId
   * @param {Address} contract
   * @param {string} name
   * @param {number} version
   * @param {number=} decimals
   */
  constructor(chainId, contract, name, version, decimals) {
    super(chainId, contract, decimals);
    /** @const {string} */
    this.name = name;
    /** @const {number} */
    this.version = version;
  }

  /**
   * @param {Provider} provider
   * @param {Address} owner
   * @return {Promise<string>}
   */
  nonces(provider, owner) {
    return /** @type {Promise<string>} */(provider
      .read({
        chainId: this.chainId,
        to: this.contract,
        data: "0x7ecebe00" + abi.address(owner)
      })
    );
  }

  /**
   * @param {Provider} provider
   * @param {Address} owner
   * @param {Address} spender
   * @param {bigint} value
   * @param {number} duration
   * @return {Promise<PermitData>}
   */
  createPermit(provider, owner, spender, value, duration) {
    const deadline = (Date.now() / 1000 + duration).toString(16);

    return provider
      .signData(owner, /** @type {EIP712TypedData} */({
        types: {
          "EIP712Domain": [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          "Permit": [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
          ]
        },
        domain: {
          name: this.name,
          version: "" + this.version,
          chainId: this.chainId,
          verifyingContract: this.contract
        },
        primaryType: "Permit",
        message: {
          "owner": owner,
          "spender": spender,
          "value": "0x" + value.toString(16),
          "nonce": "0x0",
          "deadline": "0x" + deadline
        }
      }))
      .then((/** @type {WideSignature} */ sig) =>
        deadline.padStart(12, "0") + abi.address(this.contract) + signature.fromWide(sig)
      );
  }
}

export {
  ERC20,
  ERC20Permit
};
