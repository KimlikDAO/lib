import { Code } from "./types";

type Program = Uint8Array<ArrayBuffer>;

/*
const layout = (code: FlatCode): Layout => {
  const tokens = [...flatten(parts)];

  while (true) {
    let offset = 0;
    const placements = Array<number>(MaxLabels).fill(-1);

    for (const token of tokens) {
      if (typeof token == "number") {
        offset += 1;
        continue;
      }
      if (token instanceof Uint8Array) {
        offset += token.length;
        continue;
      }
      if (token instanceof Label) {
        if (placements[token.id] != -1)
          throw new Error(`${Label.describe(token)} was placed more than once`);
        placements[token.id] = offset;
        continue;
      }
      offset += token.serializedLength;
    }

    let changed = false;
    for (const token of tokens) {
      if (!(token instanceof LabelRef)) continue;
      const target = placements[token.label.id];
      if (target == -1)
        throw new Error(
          `${Label.describe(token.label)} was referenced but never placed`,
        );
      const nextLen = encodePushNumber(target).length;
      if (nextLen != token.serializedLength || target != token.absoluteAddress) {
        token.serializedLength = nextLen;
        token.absoluteAddress = target;
        changed = true;
      }
    }

    if (!changed)
      return {
        length: offset,
        tokens,
        placements,
      };
  }
}; */

const assemble = (..._code: Code): Program => {
  /*
  const { length, tokens } = layout(...parts);
  const out = new Uint8Array(length);
  let offset = 0;

  for (const token of tokens) {
    if (typeof token == "number") {
      out[offset] = token;
      offset += 1;
      continue;
    }
    if (token instanceof Uint8Array) {
      out.set(token, offset);
      offset += token.length;
      continue;
    }
    if (token instanceof Label) continue;

    const encoded = encodePushNumber(token.absoluteAddress);
    out.set(encoded, offset);
    offset += encoded.length;
  }

  for (const token of tokens) {
    if (!(token instanceof LabelRef) || !token.jump) continue;
    if (out[token.absoluteAddress] != Op.JUMPDEST)
      throw new Error(
        `${Label.describe(token.label)} is used as a jump target but does not point to a JUMPDEST`,
      );
  }

  return out;*/
  return new Uint8Array();
};

export { assemble, Program };
