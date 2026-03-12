import { compareImpls, compareImplsArray } from "../../testing/bench";
import hex from "../hex";

const FromUint8 = hex.FromUint8;

/** @pure */
const hexFrom = (bytes: Uint8Array): string => {
  const octets: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; ++i)
    octets[i] = FromUint8[bytes[i]];
  return octets.join("");
}

const hexFrom_2 = (bytes: Uint8Array): string => Array.from(bytes,
  (i) => FromUint8[i as number]).join("");

const input = Uint8Array.from("0123123123123980123");
const output = hex.from(input);
console.log(input, output);

compareImpls([
  hexFrom_2,
  hexFrom,
  hex.from
], 1000, [input], output);


/** @pure */
const toUint8Array = (str: string): Uint8Array => {
  if (str.length & 1) str = "0" + str;
  const buff = new Uint8Array(str.length / 2);
  for (let i = 0, j = 0; i < str.length; ++j, i += 2)
    buff[j] = parseInt(str.slice(i, i + 2), 16);
  return buff;
}

/** @pure */
const toUint8Array_2 = (str: string): Uint8Array => {
  if (str.length & 1) str = "0" + str;
  const buff = new Uint8Array(str.length / 2);

  for (let i = 0, j = 0; i < str.length; ++j, i += 2) {
    // Direct character code conversion instead of parseInt
    const high = str.charCodeAt(i);
    const low = str.charCodeAt(i + 1);
    const highVal = high - (high <= 57 ? 48 : (high <= 70 ? 55 : 87));
    const lowVal = low - (low <= 57 ? 48 : (low <= 70 ? 55 : 87));
    buff[j] = (highVal * 16) | lowVal;
  }

  return buff;
}

compareImplsArray([
  toUint8Array_2,
  toUint8Array,
  toUint8Array_2,
  toUint8Array
], 10000, [output], input);
