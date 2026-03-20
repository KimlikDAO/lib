/**
 * A 48-bit hash used throughout kastro from compilation freshness checks to
 * ETAGS to asset content hashes.
 */
type Hash = number;

/**
 * Base64url encoded hash of length 8. Encodes a 48-bit hash into a string of
 * 8 characters.
 */
type StrHash = string;

export { Hash, StrHash };
