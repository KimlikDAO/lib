import { assertIs } from "../../util/assert";
import { evaluate } from "../wesolowski";

const buff = Uint32Array.from("00000001".repeat(5));

assertIs(buff.length, 40);
assertIs(buff.buffer.byteLength, 160);

const gArr = new Uint32Array(buff.buffer, 0, 8);
gArr.set([1, 2, 3, 4, 5, 6, 7, 8]);

assertIs(gArr.length, 8);
assertIs(gArr[7], 8);

console.time("evaluate()");
const { y } = evaluate(gArr, 1 << 20);
console.timeEnd("evaluate()");

assertIs(y.length, 32);
