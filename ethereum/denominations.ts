const wei = 1n;
const kwei = 1000n;
const mwei = 10n ** 6n;
const gwei = 10n ** 9n;
const szabo = 10n ** 12n;
const finney = 10n ** 15n;
const ether = 10n ** 18n;

const Decimals: Record<string, number> = {
  "wei": 0,
  "kwei": 3,
  "mwei": 6,
  "gwei": 9,
  "szabo": 12,
  "finney": 15,
  "ether": 18,
};

const parseEther = (value: string): bigint => {
  const match = value.trim().match(/^(\d+)(?:\.(\d+))?\s*([a-zA-Z]+)$/);
  if (!match) return -1n;
  const [, whole, frac = "", unit] = match;
  const decimals = Decimals[unit.toLowerCase()] ?? -1;
  if (frac.length > decimals) return -1n;
  return BigInt(whole + frac + "0".repeat(decimals - frac.length));
};

export { ether, finney, gwei, kwei, mwei, parseEther, szabo, wei };
