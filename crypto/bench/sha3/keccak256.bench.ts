import { bench } from "../../../testing/bench";
import { f, keccak256Uint8 } from "../../sha3";

/** @pure */
const keccak256Uint8_Array = (bytes: Uint8Array): Uint8Array => {
  const words = new Uint32Array(bytes.buffer, 0, bytes.length >> 2);
  const s = Array(50);
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  let j = 0;
  for (; i < words.length; ++i, ++j)
    s[j] ^= words[i];
  const mod = bytes.length & 3;
  const loc = bytes.length & ~3;
  if (mod == 0) s[j] ^= 1;
  else if (mod == 1) s[j] ^= bytes[loc] | 256;
  else if (mod == 2) s[j] ^= bytes[loc] | bytes[loc + 1] << 8 | (1 << 16);
  else s[j] ^= bytes[loc] | bytes[loc + 1] << 8 | bytes[loc + 2] << 16 | (1 << 24);
  s[33] ^= 1 << 31;
  f(s);
  const out = new Uint8Array(32);
  for (let i = 0, j = 0; i < 32; i += 4, ++j) {
    out[i + 0] = (s[j] & 0xff);
    out[i + 1] = (s[j] >>> 8) & 0xff;
    out[i + 2] = (s[j] >>> 16) & 0xff;
    out[i + 3] = (s[j] >>> 24) & 0xff;
  }
  return out;
}

/** @pure */
const keccak256Uint8_Uint32Array = (bytes: Uint8Array): Uint8Array => {
  const words = new Uint32Array(bytes.buffer, 0, bytes.length >> 2);
  const s = new Uint32Array(50);
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  let j = 0;
  for (; i < words.length; ++i, ++j)
    s[j] ^= words[i];
  const mod = bytes.length & 3;
  const loc = bytes.length & ~3;
  if (mod == 0) s[j] ^= 1;
  else if (mod == 1) s[j] ^= bytes[loc] | 256;
  else if (mod == 2) s[j] ^= bytes[loc] | bytes[loc + 1] << 8 | (1 << 16);
  else s[j] ^= bytes[loc] | bytes[loc + 1] << 8 | bytes[loc + 2] << 16 | (1 << 24);
  s[33] ^= 1 << 31;
  f(s);
  return new Uint8Array(s.buffer, 0, 32);
}

const Encoder = new TextEncoder();

const Text1 = "test string".repeat(1000);
const Text2 = "test string but longer".repeat(500);
const Text3 = "z".repeat(1000);

bench("keccak256", {
  "keccak256 (current implementation)": keccak256Uint8,
  "keccak256 (Uint32Array)": keccak256Uint8_Uint32Array,
  "keccak256 (Array)": keccak256Uint8_Array,
}, {
  repeat: 100,
  dataset: [{
    args: [Encoder.encode(Text1)],
    expected: keccak256Uint8(Encoder.encode(Text1))
  }, {
    args: [Encoder.encode(Text2)],
    expected: keccak256Uint8(Encoder.encode(Text2))
  }, {
    args: [Encoder.encode(Text3)],
    expected: keccak256Uint8(Encoder.encode(Text3))
  }],
});
