/** 32-byte content hash. */
type ContentHash = Uint8Array;

/** 32-byte dependency hash. */
type DependencyHash = Uint8Array;

/** A base64 encoded hash of length 8 (6 bytes). */
type AssetHash = string;

const toStr = (bytes: Uint8Array): AssetHash =>
  bytes.subarray(0, 6).toBase64({ alphabet: "base64url" });

const equal = (a: ContentHash, b: ContentHash): boolean => {
  for (let i = 0; i < 32; ++i)
    if (a[i] != b[i]) return false;
  return true;
};

/**
 * Adds b to a in place in mod 256: a[i] += b[i] for i in 0..32.
 */
const combine = (a: ContentHash, b: ContentHash): void => {
  for (let i = 0; i < 32; ++i)
    a[i] += b[i];
};

export default {
  toStr,
  equal,
  combine
};

export {
  AssetHash,
  ContentHash,
  DependencyHash,
};
