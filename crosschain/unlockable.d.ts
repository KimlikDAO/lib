import { EncryptedData } from "../ethereum/encryptedData.d";

/**
 * An encrypted piece of data, which typically is stored inside an
 * NFT.
 *
 * The unlockable is modeled after the ethereum EncryptedData,
 * though the wireformat is the same on all blockchains.
 */
interface Unlockable extends EncryptedData {
  readonly userPrompt: string;
}

export { Unlockable };
