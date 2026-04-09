/** @satisfies {InlineFn} */
function arr<T>(x: T[] | T): T[] {
  return Array.isArray(x) ? x : [x];
}

console.log(arr([1, 2, 3]));
console.log(arr([1n, 2n, 3n]));
console.log(arr("123"));
console.log(arr(["1", "2", "3"]));
