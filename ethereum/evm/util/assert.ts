const assert = (expr: boolean, message = "no good") => {
  if (!expr) throw new Error(message);
}

export { assert };
