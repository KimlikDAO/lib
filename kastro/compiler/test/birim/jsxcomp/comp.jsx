// @jsxImportSource ../../../

const fibonacci = (n) => {
  let a = 0n, b = 1n, c;
  while (--n) {
    c = a + b;
    a = b;
    b = c;
  }
  return b;
};

const JsxComp = ({ n }) => <div>JsxComp {fibonacci(n)}</div>;

export default JsxComp;

export { fibonacci };
