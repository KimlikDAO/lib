import { readFileSync, writeFileSync } from "fs";

const compress = (decimal) => {
  const numberPart = decimal.slice(0, -1);
  const bigintNumber = BigInt(numberPart);
  const hexadecimal = "0x" + bigintNumber.toString(16) + "n";
  const diff = decimal.length - hexadecimal.length;
  if (diff > 0)
    console.log(`Replacing (saved ${diff} bytes)\x1b[34m${decimal}"\x1b[0m -> ${hexadecimal}`);
  return diff > 0 ? hexadecimal : decimal;
}

export const bigIntPass = (code) => code.replace(/\d+n/g, (m) => compress(m));
