import { Fragment } from "./fragment";
import { Signature } from "./signature";
import { Statement } from "./statement";

const bind = (
  _prefix: Signature,
  _stmt: Statement,
  _keep: Set<string>
): Fragment => {
  return Fragment.from({});
}

export { bind };
