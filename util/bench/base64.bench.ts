import { bench } from "../../util/testing/bench";
import base64 from "../base64";
import hex from "../hex";

/** @pure */
const fromBigIntViaHex = (n: bigint): string =>
  base64.from(hex.toUint8Array(n.toString(16)));

bench("base64.fromBigInt", {
  "native": base64.fromBigInt,
  "viaHex": fromBigIntViaHex,
}, {
  repeat: 10,
  dataset: [{
    args: [123456789n], expected: "B1vNFQ=="
  }],
});

const output = "U29tZSBiYXNlNjQgZGF0YS4=";
const input = base64.toBytes(output);

/** @pure */
const fromSpreadMap = (b: Uint8Array): string =>
  btoa([...b].map((x: number) => String.fromCharCode(x)).join(""));

/** @pure */
const fromArrayFrom = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (x) => String.fromCharCode(x as number)).join(""));

/** @pure */
const fromConcatLoop = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; ++i)
    binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
};

/** @pure */
const fromJoinLoop = (bytes: Uint8Array): string => {
  const chars: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; ++i)
    chars[i] = String.fromCharCode(bytes[i]!);
  return btoa(chars.join(""));
};

bench("base64.from (bytes → base64)", {
  "native": base64.from,
  "spreadMap": fromSpreadMap,
  "arrayFrom": fromArrayFrom,
  "concatLoop": fromConcatLoop,
  "joinLoop": fromJoinLoop,
}, {
  repeat: 1000,
  dataset: [{
    args: [input], expected: output
  }],
});
