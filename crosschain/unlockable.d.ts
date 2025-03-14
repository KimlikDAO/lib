import eth from "../ethereum/encryptedData.d";

/**
 * An encrypted piece of data, which typically is stored inside an
 * NFT.
 *
 * The unlockable is modeled after the eth.EncryptedData, though the wireformat
 * is the same on all blockchains.
 */
interface Unlockable extends eth.EncryptedData {
  readonly userPrompt: string;
}

export { Unlockable };
