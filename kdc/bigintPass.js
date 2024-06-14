/**
 * @fileoverview Convert large bigints to hexadecimal to save space.
 * Will be obsolete after https://github.com/google/closure-compiler/pull/4166
 * is released.
 */

/**
 * @param {string} code
 * @return {string}
 */
const bigintPass = (code) => code.replace(/\d+n/g, (/** string */ decimal) => {
  const bigintNumber = BigInt(decimal.slice(0, -1));
  const hexadecimal = "0x" + bigintNumber.toString(16) + "n";
  const diff = decimal.length - hexadecimal.length;
  if (diff > 0)
    console.log(`Replacing (saved ${diff} bytes)\x1b[34m${decimal}"\x1b[0m -> ${hexadecimal}`);
  return diff > 0 ? hexadecimal : decimal;
});

export { bigintPass };
