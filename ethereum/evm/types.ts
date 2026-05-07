import { Op, OpData } from "./opcodes";
import { assert } from "./util";

const InspectCustom = Symbol.for("nodejs.util.inspect.custom");

type EvmType =
  | typeof Word
  | typeof Data
  | typeof Uint
  | typeof Weis
  | typeof Locn
  | typeof Size
  | typeof Addr
  | typeof Bool;

type Bytes = Uint8Array<ArrayBuffer>;

class Word {
  static name = "";
  constructor(private word: Bytes) { }

  toString() { return "" + this.word; }
}

class Data extends Word {
  static override name = "Data";
}

class Addr extends Word {
  static override name = "Addr";
}

class Uint extends Word {
  static override name = "Uint";
}

class Weis extends Uint {
  static override name = "Weis";
}

class Locn extends Uint {
  static override name = "Locn";
}

class Size extends Uint {
  static override name = "Size";
}

class Bool extends Word {
  static override name = "Bool";
}

type TypeList = readonly EvmType[];
type EnsureNames = readonly (string | undefined)[];
type HaltState = "⊣" | "⊥" | "⊤" | "⊢";

const isAssignable = (sup: EvmType, sub: EvmType): boolean =>
  sub === sup || sup.isPrototypeOf(sub);

const narrowType = (
  a: EvmType,
  b: EvmType,
  context = "conflicting expectation",
): EvmType => {
  if (isAssignable(a, b)) return b;
  if (isAssignable(b, a)) return a;
  throw new TypeError(`${context}: ${a.name} vs ${b.name}`);
}

class Signature {
  constructor(
    readonly expect: TypeList,
    readonly ensure: TypeList,
    readonly pop: number,
    readonly halt?: HaltState,
    readonly ensureNames: EnsureNames = Array(ensure.length).fill(undefined),
  ) {
    assert(ensure.length == ensureNames.length,
      `Signature ensureNames length ${ensureNames.length}`
      + ` does not match ensure length ${ensure.length}`);
  }

  toString(): string {
    const halt = this.halt
      ? this.ensure.length ? ", " + this.halt : this.halt
      : "";
    const pop = this.pop < 0 ? "*" : "" + this.pop;
    const expect = this.expect.map((type) => type.name).join(", ");
    const ensure = this.ensure.map((type, i) =>
      this.ensureNames[i] ? type.name
        ? `${this.ensureNames[i]}: ${type.name}` : this.ensureNames[i]
        : type.name
    ).join(", ");
    return `(${expect}) → ${pop}|${ensure}${halt}`;
  }
  [InspectCustom](): string {
    return this.toString();
  }
}

type CodeAtom =
  | Op
  | OpData
  | Label
  | LabelRef

type FlatCode = readonly CodeAtom[];
type Code = readonly (CodeAtom | Fragment)[];

class Fragment {
  constructor(
    readonly expect: TypeList,
    readonly pop: number,
    readonly ensure: TypeList,
    readonly code: FlatCode,
    readonly halt?: HaltState,
    readonly ensureNames: EnsureNames = Array(ensure.length).fill(undefined),
  ) {
    assert(Number.isInteger(pop),
      `Fragment pop must be an integer, received ${pop}`);
    assert(-1 <= pop,
      `Fragment pop must be -1 or non-negative, received ${pop}`);
    assert(pop <= expect.length,
      `Fragment pop ${pop} exceeds expect length ${expect.length}`);
    assert(ensure.length == ensureNames.length,
      `Fragment ensureNames length ${ensureNames.length}`
      + ` does not match ensure length ${ensure.length}`);
  }

  signature(): Signature {
    return new Signature(
      this.expect,
      this.ensure,
      this.pop,
      this.halt,
      this.ensureNames,
    );
  }
}

class LabelRef {
  serializedLength = 1;
  absoluteAddress = 0;

  constructor(
    readonly labelId: number,
    readonly jump: boolean,
  ) { }
}

class Label {
  static next = 0;
  static names: (string | undefined)[] = [];

  static describe(label: Label): string {
    return label.name ? `label "${label.name}"` : "anonymous label";
  }

  readonly id: number;
  constructor(readonly name?: string) {
    this.id = Label.next++;
    if (name) Label.names[this.id] = name;
  }

  ref(jump = false): Fragment {
    return new Fragment([], 0, [Locn], [new LabelRef(this.id, jump)]);
  }
  dest(): Fragment {
    return new Fragment([], 0, [], [this, Op.JUMPDEST]);
  }
}

const label = (name?: string): Label => new Label(name);

export {
  Addr,
  Bool,
  Bytes,
  Code,
  CodeAtom,
  Data,
  EvmType,
  EnsureNames,
  FlatCode,
  Fragment,
  HaltState,
  Label,
  LabelRef,
  Locn,
  Signature,
  Size,
  TypeList,
  Uint,
  Weis,
  Word,
  isAssignable,
  label,
  narrowType,
};
