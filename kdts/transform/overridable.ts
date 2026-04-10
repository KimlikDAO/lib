import { VariableDeclarator } from "acorn";
import { isIdentifier, isSatisfiesExpression } from "../ast/guards";
import { Mutator } from "../ast/walk";
import { TsParser } from "../parser/tsParser";
import { CodeUpdater } from "../util/textual";

class OverridableTransform extends Mutator {
  constructor(
    private readonly updater: CodeUpdater,
    private readonly overrides: Record<string, unknown>
  ) { super(); }

  VariableDeclarator(n: VariableDeclarator) {
    if (!isIdentifier(n.id) || !isSatisfiesExpression(n.init) ||
      !Object.hasOwn(this.overrides, n.id.name))
      return;
    this.updater.replace(n.init, JSON.stringify(this.overrides[n.id.name]));
    return true;
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
  new OverridableTransform(updater, overrides).mut(ast);
  return updater.updates.length ? updater.apply(content) : content;
};

export {
  OverridableTransform,
  transpileOverridables
};
