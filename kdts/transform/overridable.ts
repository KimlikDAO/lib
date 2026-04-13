import {
  isIdentifier,
  isSatisfiesExpression,
  typeReferenceName
} from "../ast/guards";
import { VariableDeclarator } from "../ast/types";
import { Mutator } from "../ast/walk";
import { TsParser } from "../parser/tsParser";
import { CodeUpdater } from "../util/textual";

class BunTransform extends Mutator {
  constructor(
    private readonly updater: CodeUpdater,
    private readonly overrides: Record<string, unknown>
  ) { super(); }

  VariableDeclarator(n: VariableDeclarator) {
    const { id, init } = n;
    if (!isIdentifier(id)) return false;
    if (isSatisfiesExpression(init)
      && typeReferenceName(init.typeAnnotation) == "Overridable"
      && Object.hasOwn(this.overrides, id.name)) {
      this.updater.replace(init, JSON.stringify(this.overrides[id.name]));
      return true;
    }
    return false;
  }
}

const transpileOverridables = (
  content: string,
  overrides: Record<string, unknown>
): string => {
  if (!content.includes("Overridable") || !Object.keys(overrides).length)
    return content;

  const ast = TsParser.parse(content);
  const updater = new CodeUpdater();
  new BunTransform(updater, overrides).mut(ast);
  return updater.updates.length ? updater.apply(content) : content;
};

export {
  BunTransform,
  transpileOverridables
};
