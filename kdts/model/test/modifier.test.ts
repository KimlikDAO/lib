import { expect, test } from "bun:test";
import { Modifier, modifiersFromJsDoc } from "../modifier";

const expectModifiers = (jsDoc: string, expected: number) => () => {
  expect(modifiersFromJsDoc(jsDoc)).toBe(expected);
};

test(
  "parses direct modifier tags without rescanning the whole comment",
  expectModifiers(
    `
 * @define {bigint}
 * @noinline
 * @nosideeffects
`,
    Modifier.NoInline | Modifier.NoSideEffects
  )
);

test(
  "parses @pureOrBreakMyCode as pure",
  expectModifiers(
    `
 * @pureOrBreakMyCode
`,
    Modifier.Pure
  )
);

test(
  "parses @modifies {arguments}",
  expectModifiers(
    `
 * @modifies {arguments}
`,
    Modifier.ModifiesArgumentsOnly
  )
);

test(
  "parses @modifies {this}",
  expectModifiers(
    `
 * @modifies {this}
`,
    Modifier.ModifiesThisOnly
  )
);

test(
  "ignores unsupported @modifies targets",
  expectModifiers(
    `
 * @modifies {window}
`,
    0
  )
);
