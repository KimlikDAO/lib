import { keccak256Uint8 } from "../crypto/sha3";
import { base64 } from "../util/çevir";

/**
 * @param {number} index
 * @return {string}
 */
const indexToMinified = (index) => {
  let result = "";

  {
    /**
     * First character must be [A-Za-z] (52 possibilities)
     * @const {number}
     */
    const c = index % 52;
    result += String.fromCharCode(c + (c < 26 ? 65 : 71));
    if (index < 52) return result;
    index = (index / 52) | 0;
  }

  for (; ;) {
    /** @const {number} */
    const c = index % 64;
    // Map 0-63 to allowed characters:
    // 0-25: A-Z
    // 26-51: a-z
    // 52-61: 0-9
    // 62: _
    // 63: -
    const charCode = c < 52
      ? c + (c < 26 ? 65 : 71)
      : c < 62
        ? c - 4 // 0-9 
        : c == 62 ? 95 : 45; // -
    result += String.fromCharCode(charCode);
    if (index < 64) return result;
    index = (index / 64) | 0;
  }
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
  minifiedIds = new Set(["mpasel", "mpahide", "mpadis"]);

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
      if (this.minifiedIds.has(namespace + indexToMinified(index)))
        ++index;
      this.namespaceToNext.set(namespace, index + 1);
      this.keyToIndex.set(namespace + key, index);
    }
    const minifiedId = indexToMinified(index);
    this.minifiedIds.add(namespace + minifiedId);
    return minifiedId;
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
  minifiedIds = new Set(["sel", "hide", "dis"]);

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
}

/**
 * @implements {DomIdMapper}
 */
class BasicMapper {
  map(namespace, context, domId) {
    return hashKey(`${namespace}#${context}#${domId}`);
  }
}

export {
  BasicMapper,
  DomIdMapper,
  GlobalMapper,
  indexToMinified,
  LocalMapper
};
