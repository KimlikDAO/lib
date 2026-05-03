import { Arg, EvmType, Fragment, StackRef } from "./types";

type Combinable = Fragment | StackRef;

const infer = (arg: Arg, type: EvmType): Combinable => {
  if (arg instanceof StackRef)
    arg.bindType(type);
  else if (!(arg instanceof Fragment))
    arg = Fragment.fromArg(arg, type);
  return arg;
}

const compose = (..._frags: Fragment[]): Fragment => {
  return new Fragment([], [], 0, []);
}

const combine = (..._combs: Combinable[]): Fragment => {
  return new Fragment([], [], 0, []);
}

export { combine, compose, infer };
