// kdts run kdts/showcase/array.ts --override squares="[36,49,64]"

import { Overridable } from "@kimlikdao/kdts";

const squares = [1, 4, 9, 25] satisfies Overridable

/** @satisfies {InlineFn} */
function arr<T>(x: T[] | T): T[] {
  return Array.isArray(x) ? x : [x];
}

export default () => {
  const arrSq = arr(squares);
  for (const i of arrSq)
    console.log(i)
  return arrSq;
}
