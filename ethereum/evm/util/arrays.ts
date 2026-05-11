const hashArray = (values: readonly number[]): number => {
  let lo = 0x811c9dc5 ^ values.length;
  let hi = 0x9e3779b9 ^ values.length;
  for (const value of values) {
    const mixed = mixSigned(value);
    lo = Math.imul(lo ^ mixed, 0x01000193);
    hi = Math.imul(((hi << 13) | (hi >>> 19)) ^ mixed, 0x85ebca6b);
  }
  lo = fmix32(lo);
  hi = fmix32(hi ^ lo);
  return ((hi >>> 11) * 0x100000000) + (lo >>> 0);
}

const mixSigned = (value: number): number => {
  const signed = value | 0;
  return ((signed << 1) ^ (signed >> 31)) >>> 0;
}

const fmix32 = (value: number): number => {
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
}

export { hashArray };
