type C = {
  r: number,
  i: number
}

const add = (x: C, y: C): C => ({
  r: x.r + y.r,
  i: x.i + y.i
});

const mul = (x: C, y: C): C => ({
  r: x.r * y.r - x.i * y.i,
  i: x.r * y.i + x.i * y.r
});

const polynomial = (...coeff: C[]): (x: C) => C => {
  return (x: C): C => {
    let y = coeff[0];
    let xt = x;
    for (let i = 1; i < coeff.length; ++i) {
      y = add(y, mul(coeff[i], xt));
      xt = mul(xt, x);
    }
    return y;
  }
}

const i = { r: 0, i: 1 };

const c = (r: number): C => ({ r, i: 0 });

/** @satisfies {PureFn} */
const P = polynomial(i, c(2), c(3));

console.log(P({ r: 1, i: -1 }));
