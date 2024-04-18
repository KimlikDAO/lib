const üret = (values) => {
  let n = values.n;
  let a = 0n;
  let b = 1n;
  let c = 0n;
  while (n--) {
    c = a;
    a = b;
    b += c;
  }
  return a.toString();
}

export { üret };
