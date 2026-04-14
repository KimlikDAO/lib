import {
  isIdentifier,
  isSatisfiesExpression,
  typeReferenceName
} from "../ast/guards";
import { TSSatisfiesExpression, VariableDeclarator } from "../ast/types";
import { Mutator } from "../ast/walk";
import { CodeUpdater } from "../util/textual";

class BunTransform extends Mutator {
  updater = new CodeUpdater();

  constructor(
    private readonly content: string,
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
  TSSatisfiesExpression(n: TSSatisfiesExpression) {
    if (typeReferenceName(n.typeAnnotation) == "PureExpr") {
      const expr = this.content.slice(n.expression.start, n.expression.end);
      this.updater.replace(n, `/*#__PURE__*/(()=>(${expr}))()`);
      return true;
    }
    return false;
  }
  apply(): string {
    return this.updater.apply(this.content);
  }
}

export { BunTransform };
