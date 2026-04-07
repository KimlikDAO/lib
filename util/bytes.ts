/** @satisfies {PureFn} */
const fromUint32ArrayBE = (arr: Uint32Array): Uint8Array => {
  const n = arr.length * 4;
  const bytes = new Uint8Array(n);
  for (let i = 0, j = 0; j < n; ++i, j += 4) {
    const word = arr[i];
    bytes[j + 0] = word >>> 24;
    bytes[j + 1] = (word >>> 16) & 0xff;
    bytes[j + 2] = (word >>> 8) & 0xff;
    bytes[j + 3] = word & 0xff;
  }
  return bytes;
};

/** @satisfies {PureFn} */
const toUint32ArrayBE = (bytes: Uint8Array): Uint32Array => {
  const n = bytes.length;
  const arr = new Uint32Array((n + 3) / 4);
  for (let i = 0, j = 0; j < n; ++i, j += 4)
    arr[i] = (bytes[j + 0] << 24)
      | (bytes[j + 1] << 16)
      | (bytes[j + 2] << 8)
      | bytes[j + 3];
  return arr;
};

export default {
  fromUint32ArrayBE,
  toUint32ArrayBE,
};
