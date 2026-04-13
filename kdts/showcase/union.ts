function printId(id: number | string) {
  if (typeof id === "string") {
    // In this branch, id is of type 'string'
    console.log(id.toUpperCase());
  } else {
    // Here, id is of type 'number'
    console.log(id);
  }
}

printId(12);
printId("12");

/** @satisfies {InlineFn} */
function welcomePeople(x: string[] | string) {
  if (Array.isArray(x)) {
    // Here: 'x' is 'string[]'
    console.log("Hello, " + x.join(" and "));
  } else {
    // Here: 'x' is 'string'
    console.log("Welcome lone traveler " + x);
  }
}

welcomePeople("a");
welcomePeople(["c", "d"]);

// TODO: The following function, for instance, doesn't compile in kdts strict
// mode yet since the gcc method merging isn't precise enough here. The merged
// method collapses to Function. With proper fixes, it could collapse to
// (this: string | number[], begin?: number, end?: number) => string | number[]
function getFirstThree(x: number[] | string): number[] | string {
  return x.slice(0, 3);
}

console.log(getFirstThree("abcd"));
