import { keccak256, keccak256Uint8 } from "../../crypto/sha3";
import hex from "../../util/hex";
import abi from "../abi";
import {
  EIP712DomainData,
  EIP712Type,
  EIP712TypedData,
  EIP712TypeRegistry
} from "./EIP712.d";

const TypeRegistry: EIP712TypeRegistry = {
  "EIP712Domain": [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
  ]
};

/**
 * Full type string for a struct (including dependent struct type strings, sorted by name).
 * Primary type first, then all recursive deps in alphabetical order.
 */
const encodeType = (typeName: EIP712Type, typeRegistry: EIP712TypeRegistry): string => {
  const seen = new Set<string>();
  const stack = [typeName] as string[];
  while (stack.length) {
    const childName = stack.pop() as string;
    if (seen.has(childName)) continue;
    seen.add(childName);
    const childType = typeRegistry[childName];
    if (!childType) continue;
    for (const { type } of childType)
      if (type in typeRegistry)
        stack.push(type);
  }
  let ordered = [...seen].filter((t: string) => t != typeName).sort();
  ordered = [typeName, ...ordered] as string[];
  let ser = "";
  for (const type of ordered)
    ser += `${type}(${typeRegistry[type].map((m) => `${m.type} ${m.name}`).join(",")})`;
  return ser;
};

const typeHash = (typeName: EIP712Type, typeRegistry: EIP712TypeRegistry): string =>
  keccak256(encodeType(typeName, typeRegistry));

const structHash = (
  data: Record<string, unknown>,
  typeName: EIP712Type,
  typeRegistry: EIP712TypeRegistry
): string => {
  let ser = typeHash(typeName, typeRegistry);
  for (const { name, type } of typeRegistry[typeName]) {
    const value = data[name];
    switch (type) {
      case "address":
        ser += abi.address(value as string).toLowerCase(); break;
      case "uint256":
        ser += abi.uint256(value as number | bigint | string); break;
      case "string":
        ser += keccak256(value as string); break;
      default:
        ser += structHash(value as Record<string, unknown>, type as EIP712Type, typeRegistry);
    }
  }
  return hex.from(keccak256Uint8(hex.toUint8Array(ser)));
};

const domainSeparator = (domainData: EIP712DomainData): string =>
  structHash(domainData, "EIP712Domain", TypeRegistry);

const typedDataHash = (typedData: EIP712TypedData): string => {
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
