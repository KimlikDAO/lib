/**
 * @fileoverview An extension to ERC721Metadata, which allows for encrypted
 * data to be stored inside an NFT.
 *
 * @author KimlikDAO
 */

import { Unlockable } from "../../crosschain/unlockable.d";

interface ERC721MetaData {
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly external_url: string;
  readonly animation_url?: string;
  readonly background_color?: string;
  readonly youtube_url?: string;
};

interface ERC721Unlockable extends ERC721MetaData {
  readonly unlockables: Record<string, Unlockable>;
};

export {
  ERC721MetaData,
  ERC721Unlockable
};
