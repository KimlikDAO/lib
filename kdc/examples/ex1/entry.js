import { d, e, f } from "bun:bun";
import { x, y, z } from "honey:bun";
import { g } from "./mod";

/**
 * @param {string} str
 * @param {number} num
 * @return {string}
 */
const func = (str, num) => {
  return str + "a" + num;
}

/** @const {!bigint} */
const a = 111231123123123123123123123123123123123123123n;
const b = 2;
const c = 3;

export const AA = 11, CC = 33;

export function BB() {
  console.log("BB");
}

export async function BB_async() {
  return Promise.resolve("BB_async");
}

export class KLASS {
  constructor() {
    this.klass = "very high";
  }
}

export { a, b, c, d, e, f, func, g, x, y, z };

export default b;
