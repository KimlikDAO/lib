import { assertEq } from "../../testing/assert";
import { evaluate } from "../wesolowski";

/** @const {Uint32Array} */
const buff = Uint32Array.from("00000001".repeat(5));

assertEq(buff.length, 40);
assertEq(buff.buffer.byteLength, 160);

const gArr = new Uint32Array(buff.buffer, 0, 8);
gArr.set([1, 2, 3, 4, 5, 6, 7, 8]);

assertEq(gArr.length, 8);
assertEq(gArr[7], 8);

console.time("evaluate()");
const { y, π, l } = evaluate(gArr, 1 << 20);
console.timeEnd("evaluate()");

assertEq(y.length, 32);
