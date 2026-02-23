import { keccak256, keccak256Uint8 } from "../../crypto/sha3";
import hex from "../../util/hex";
import abi from "../abi";
import {
  EIP712DomainData,
  EIP712Type,
  EIP712TypedData,
  EIP712TypeRegistry
} from "./EIP712.d";

/** @const {EIP712TypeRegistry} */
const TypeRegistry = /** @type {EIP712TypeRegistry} */({
  "EIP712Domain": [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
  ]
});

/**
 * Full type string for a struct (including dependent struct type strings, sorted by name).
 * Primary type first, then all recursive deps in alphabetical order.
 *
 * @param {EIP712Type} typeName
 * @param {EIP712TypeRegistry} typeRegistry
 * @return {string}
 */
const encodeType = (typeName, typeRegistry) => {
  const seen = new Set();
  const stack = [typeName];
  while (stack.length) {
    const childName = stack.pop();
    if (seen.has(childName)) continue;
    seen.add(childName);
    const childType = typeRegistry[childName];
    if (!childType) continue;
    for (const { type } of childType)
      if (type in typeRegistry)
        stack.push(type);
  }
  let ordered = [...seen].filter(t => t != typeName).sort();
  ordered = [typeName, ...ordered];
  let ser = "";
  for (const type of ordered)
    ser += `${type}(${typeRegistry[type].map((m) => `${m.type} ${m.name}`).join(",")})`;
  return ser;
};

/**
 * @param {EIP712Type} typeName
 * @param {EIP712TypeRegistry} typeRegistry
 * @return {string}
 */
const typeHash = (typeName, typeRegistry) =>
  keccak256(encodeType(typeName, typeRegistry));

/**
 * @param {Record<string, unknown>} data
 * @param {EIP712Type} typeName 
 * @param {EIP712TypeRegistry} typeRegistry 
 * @return {string}
 */
const structHash = (data, typeName, typeRegistry) => {
  let ser = typeHash(typeName, typeRegistry);
  for (const { name, type } of typeRegistry[typeName]) {
    const value = data[name];
    switch (type) {
      case "address":
        ser += abi.address(/** @type {string} */(value)).toLowerCase(); break;
      case "uint256":
        ser += abi.uint256(/** @type {number | bigint | string} */(value)); break;
      case "string":
        ser += keccak256(/** @type {string} */(value)); break;
      default:
        ser += structHash(/** @type {Record<string, unknown>} */(value), type, typeRegistry);
    }
  }
  return hex.from(keccak256Uint8(hex.toUint8Array(ser)));
};

/**
 * @param {EIP712DomainData} domainData
 * @return {string}
 */
const domainSeparator = (domainData) =>
  structHash(domainData, "EIP712Domain", TypeRegistry);

/**
 * @param {EIP712TypedData} typedData 
 * @return {string}
 */
const typedDataHash = (typedData) => {
  typedData.types["EIP712Domain"] ||= TypeRegistry["EIP712Domain"];
  const ser = "1901" +
    structHash(typedData.domain, "EIP712Domain", typedData.types) +
    structHash(typedData.message, typedData.primaryType, typedData.types);
  return hex.from(keccak256Uint8(hex.toUint8Array(ser)));
};

export {
  domainSeparator,
  encodeType,
  structHash,
  typedDataHash,
  typeHash
};
