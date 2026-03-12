import { Address as EthereumAddress } from "../ethereum/address.d";
import { Address as MinaAddress } from "../mina/address.d";

/**
 * A public identifier for an elliptic curve based blockchain account.
 * Represents the elliptic curve point compactly by specifying one coordinate
 * and disambiguating the other with a single bit.
 */
type PublicKey = { x: bigint, yParity: boolean };

/**
 * A public identifier for an elliptic curve based blockchain account.
 * Represents the elliptic curve point in full.
 */
type Point = { x: bigint, y: bigint };

/**
 * A blockchain address in serialized form. For instance on Ethereum a
 * a length-42 string beginning with "0x"; on Mina it is a length-55 string
 * starting with "B62".
 */
type Address = EthereumAddress | MinaAddress;

export { Address, Point, PublicKey };
