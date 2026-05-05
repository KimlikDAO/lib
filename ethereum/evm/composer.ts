import {
  CodeAtom,
  EvmType,
  Fragment,
  HaltState,
  TypeList,
  Word,
  narrowType,
} from "./types";

const peek = (frags: Fragment[]) => {
  let pos = 0;
  let len = 0;
  let pop = 0;
  for (const frag of frags) {
    len = Math.max(len, frag.expect.length - pos);
    pos -= frag.pop;
    pop = Math.max(pop, -pos);
    pos += frag.ensure.length;
    if (frag.halt) break;
  }
  return { len, pop };
}

const compose = (...frags: Fragment[]): Fragment => {
  const { len, pop } = peek(frags)
  const expect = Array<EvmType>(len).fill(Word);
  const ensure: EvmType[] = [];
  const code: CodeAtom[] = [];
  let halt: HaltState | undefined;

  let pos = 0; // Position relative to tos.
  let poc = 0; // max pop so far. -pos <= poc <= pop

  const narrowWith = (list: TypeList) => {
    const n = list.length;
    const ns = poc + pos; // length of ensure
    const nx = len + pos; // length of expect
    for (let i = 1; i <= n; ++i)
      if (i <= ns)
        ensure[ns - i] = narrowType(ensure[ns - i], list[n - i],
          `fragment output at stack position ${i}`);
      else
        expect[nx - i] = narrowType(expect[nx - i], list[n - i],
          `conflicting expectation at stack position ${len - (nx - i)}`);
  }

  for (const frag of frags) {
    code.push(...frag.code);
    if (halt) continue;
    narrowWith(frag.expect);
    pos -= frag.pop;
    ensure.length = Math.max(0, ensure.length - frag.pop);
    poc = Math.max(poc, -pos);
    ensure.push(...frag.ensure);
    pos += frag.ensure.length;
    halt = frag.halt;
  }
  return new Fragment(expect, pop, ensure, code, halt);
}

export { compose };
