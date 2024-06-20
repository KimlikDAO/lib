/**
 * @fileoverview An extension to ERC721Metadata, which allows for encrypted
 * data to be stored inside an NFT.
 *
 * @author KimlikDAO
 * @externs
 */

import eth from "./eth.d";

/**
 * @interface
 * @struct
 */
eth.ERC721Metadata = function () { }

/** @type {string} */
eth.ERC721Metadata.prototype.name;

/** @type {string} */
eth.ERC721Metadata.prototype.description;

/** @type {string} */
eth.ERC721Metadata.prototype.image;

/** @type {string} */
eth.ERC721Metadata.prototype.external_url;

/** @type {string} */
eth.ERC721Metadata.prototype.animation_url;

/** @type {string} */
eth.ERC721Metadata.prototype.background_color;

/** @type {string} */
eth.ERC721Metadata.prototype.youtube_url;

/**
 * @interface
 * @extends {eth.ERC721Metadata}
 * @struct
 */
eth.ERC721Unlockable = function () { }

/** @type {!Object<string, !crosschain.Unlockable>} */
eth.ERC721Unlockable.prototype.unlockables;
