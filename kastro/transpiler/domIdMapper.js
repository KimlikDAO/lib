import { keccak256Uint8 } from "../../crypto/sha3";
import { base64 } from "../../util/çevir";

/**
 * Maps numbers to Excel-like column names
 * @param {number} index
 * @return {string}
 */
const indexToMinified = (index) => {
  let result = "";

  // Handle first character (only A-Z, a-z allowed)
  const firstChar = index % 52;
  result += String.fromCharCode(firstChar + (firstChar < 26 ? 65 : 71));
  index = (index / 52) | 0;

  // Handle remaining characters if any (A-Z, a-z, 0-9, _, -)
  while (index > 0) {
    index--; // Decrement to handle the base-64 conversion correctly
    const c = index % 64;
    const charCode = c < 52
      ? c + (c < 26 ? 65 : 71)  // A-Z (65-90), a-z (97-122)
      : c < 62
        ? c - 4  // 0-9 (48-57)
        : c === 62 ? 95 : 45;  // _ (95) or - (45)
    result = String.fromCharCode(charCode) + result;
    index = (index / 64) | 0;
  }

  return result;
};

/**
 * @interface
 */
const DomIdMapper = function () { }

/**
 * @param {string} namespace
 * @param {string} context
 * @param {string} domId
 * @return {string} the mapped id
 */
DomIdMapper.prototype.map = function (namespace, context, domId) { }

/**
 * @param {string} namespace
 * @param {string} domId
 * @return {string} the mapped id
 */
DomIdMapper.prototype.preserve = function (namespace, domId) { }

/**
 * @param {string} key 
 * @return {string}
 */
const hashKey = (key) => "K" +
  base64(keccak256Uint8(new TextEncoder().encode(key)).subarray(0, 3))
    .replaceAll("/", "_")
    .replaceAll("+", "-");

/**
 * @implements {DomIdMapper}
 */
class GlobalMapper {
  /** @const {!Map<string, number>} */
  namespaceToNext = new Map();
  /** @const{!Map<string, number>} */
  keyToIndex = new Map();
  /** @const {!Set<string>} */
  minifiedIds = new Set();

  /**
   * @param {string} namespace
   * @param {string} context
   * @param {string} domId
   * @return {string} a minifiedId which is unique within the namespace
   */
  map(namespace, context, domId) {
    if (this.minifiedIds.has(namespace + domId)) return domId;
    const key = hashKey(`${context}#${domId}`);
    /** @type {number|undefined} */
    let index = this.keyToIndex.get(namespace + key);
    if (index == undefined) {
      index = this.namespaceToNext.get(namespace) ?? 0;
      while (this.minifiedIds.has(namespace + indexToMinified(index)))
        ++index;
      this.namespaceToNext.set(namespace, index);
      this.keyToIndex.set(namespace + key, index);
    }
    const minifiedId = indexToMinified(index);
    if (minifiedId == "zC") console.log("\n\n\n\n\n\n", context, domId, index);
    this.minifiedIds.add(namespace + minifiedId);
    return minifiedId;
  }

  /**
   * @param {string} namespace
   * @param {string} domId
   * @return {string} the mapped id
   */
  preserve(namespace, domId) {
    this.minifiedIds.add(namespace + domId);
    return domId;
  }
}

/**
 * @implements {DomIdMapper}
 */
class LocalMapper {
  /** @const {!Map<string, number>} */
  hashToNext = new Map();
  /** @const {!Map<string, number>} */
  keyToIndex = new Map();
  /** @const {!Set<string>} */
  minifiedIds = new Set();

  /**
   * @param {string} _namespace Since context values are unique across
   *                            namespaces, it is ignored.
   * @param {string} context The context of the domId, such as the file it's
   *                         in.
   * @param {string} domId The domId to map.
   * @returns {string} The minified id, unique within the namespace, since each
   *                   context belongs to a single namespace.
   */
  map(_namespace, context, domId) {
    if (this.minifiedIds.has(domId)) return domId;
    /** @const {string} */
    const hash = hashKey(context);
    /** @const {string} */
    const key = `${hash}${domId}`;
    /** @type {number|undefined} */
    let index = this.keyToIndex.get(key);
    if (index == undefined) {
      index = this.hashToNext.get(hash) ?? 0;
      this.hashToNext.set(hash, index + 1);
      this.keyToIndex.set(key, index);
    }
    const minifiedId = hash + indexToMinified(index);
    this.minifiedIds.add(minifiedId);
    return minifiedId;
  }

  /**
   * @param {string} _namespace
   * @param {string} domId
   * @return {string} the mapped id
   */
  preserve(_namespace, domId) {
    this.minifiedIds.add(domId);
    return domId;
  }
}

/**
 * @implements {DomIdMapper}
 */
class BasicMapper {
  map(namespace, context, domId) {
    return hashKey(`${namespace}#${context}#${domId}`);
  }

  /**
   * @param {string} _namespace
   * @param {string} domId
   * @return {string} the mapped id
   */
  preserve(_namespace, domId) {
    return domId;
  }
}

export {
  DomIdMapper,
  GlobalMapper,
  indexToMinified,
  LocalMapper
};
