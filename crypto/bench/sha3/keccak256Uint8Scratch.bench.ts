import { bench } from "@kimlikdao/kdts/bench";
import { f } from "../../sha3";

const Encoder = new TextEncoder();
const Bytes = Encoder.encode("test string".repeat(600));

const hashArray = (): Uint8Array => {
  const words = new Uint32Array(Bytes.buffer, 0, Bytes.length >> 2);
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
  const mod = Bytes.length & 3;
  const loc = Bytes.length & ~3;
  if (mod == 0) s[j] ^= 1;
  else if (mod == 1) s[j] ^= Bytes[loc] | 256;
  else if (mod == 2)
    s[j] ^= Bytes[loc] | Bytes[loc + 1] << 8 | (1 << 16);
  else
    s[j] ^= Bytes[loc] | Bytes[loc + 1] << 8 | Bytes[loc + 2] << 16 | (1 << 24);
  s[33] ^= 1 << 31;
  f(s);
  const out = new Uint8Array(32);
  for (let i = 0, j = 0; i < 32; i += 4, ++j) {
    out[i + 0] = s[j] & 0xff;
    out[i + 1] = (s[j] >>> 8) & 0xff;
    out[i + 2] = (s[j] >>> 16) & 0xff;
    out[i + 3] = (s[j] >>> 24) & 0xff;
  }
  return out;
};

const hashUint32Scratch = (): Uint8Array => {
  const words = new Uint32Array(Bytes.buffer, 0, Bytes.length >> 2);
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
  const mod = Bytes.length & 3;
  const loc = Bytes.length & ~3;
  if (mod == 0) s[j] ^= 1;
  else if (mod == 1) s[j] ^= Bytes[loc] | 256;
  else if (mod == 2)
    s[j] ^= Bytes[loc] | Bytes[loc + 1] << 8 | (1 << 16);
  else
    s[j] ^= Bytes[loc] | Bytes[loc + 1] << 8 | Bytes[loc + 2] << 16 | (1 << 24);
  s[33] ^= 1 << 31;
  f(s);
  return new Uint8Array(s.buffer, 0, 32);
};

const expected = hashArray();

bench("keccak256Uint8-equivalent: Array(50) vs Uint32Array(50) scratch", {
  "Array(50) + manual 32-byte out": hashArray,
  "Uint32Array(50) + Uint8Array(buffer) out": hashUint32Scratch,
}, {
  repeat: 120,
  dataset: [{ args: [], expected }],
});
