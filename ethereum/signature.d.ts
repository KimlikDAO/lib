/**
 * A string of length 132, starting with 0x.
 */
type WideSignature = `0x${string}`;

/**
 * A string of length 128 denoting a compact signature where s and yParity are
 * packed into a single uint128.
 * @see https://eips.ethereum.org/EIPS/eip-2098
 */
type Signature = string;

export { Signature, WideSignature };
