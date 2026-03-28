import {
  Identifier,
  ImportDeclaration,
  Program
} from "acorn";
import { getExt } from "../../util/paths";
import { isIdentifier } from "../ast/guards";
import { TSTypeOperator, TSTypeReference } from "../ast/types";
import { Mutator } from "../ast/walk";
import { resolvePath, SourcePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { ModuleImports } from "../model/moduleImport";
import { TsParser } from "../parser/tsParser";
import { inferArrayLikeElementType } from "../transform/inference";
import { generate } from "./generator";
import {
  synthAliasImports,
  synthComment,
  synthReadonlyArray
} from "./synthesize";

const NameMap: Record<string, string> = {
  "Record": "Object",
  "PromiseSettledResult": "Promise.AllSettledResultElement",
  "RsaHashedImportParams": "webCrypto.RsaHashedImportParams",
};

class GccTransform extends Mutator {
  private readonly typeOnlyImports = new ModuleImports();

  constructor(
    private readonly source: SourcePath,
    private readonly sources: SourceSet,
    private readonly unlinkedImports: ModuleImports
  ) { super(); }

  Identifier(n: Identifier) {
    if (Object.hasOwn(NameMap, n.name))
      n.name = NameMap[n.name];
  }
  TSTypeReference(n: TSTypeReference) {
    if (isIdentifier(n.typeName) && n.typeName.name == "Partial" && n.typeArguments?.params[0])
      this.replaceNode(n, n.typeArguments.params[0], "typeName", "typeArguments");
    return false;
  }
  Program(n: Program) {
    let lastImportStatement = -1;
    for (let i = 0; i < n.body.length; ++i) {
      const child = n.body[i]!;
      if (child.type == "ImportDeclaration")
        lastImportStatement = i;
      this.mut(child);
    }
    const aliasImports = synthAliasImports(this.typeOnlyImports);
    if (lastImportStatement != -1 && aliasImports.length)
      n.body.splice(lastImportStatement + 1, 0, ...aliasImports);
    return true;
  }
  ImportDeclaration(n: ImportDeclaration) {
    const importSource = "" + n.source.value;
    const resolvedImport = resolvePath(this.source.path, importSource);
    this.sources.add(resolvedImport);

    if (resolvedImport.source.startsWith("package:"))
      this.unlinkedImports.add(n, resolvedImport.source);
    if (resolvedImport.path.endsWith(".d.ts")) {
      this.typeOnlyImports.add(n, resolvedImport.source);
      const comment = synthComment("gcc-js: import is replaced by alias import");
      this.replaceNode(n, comment, "specifiers", "source", "importKind", "attributes");
    } else {
      const ext = getExt(resolvedImport.path);
      if (ext && !importSource.endsWith(`.${ext}`))
        n.source.raw = `"${importSource}.${ext}"`;
    }
    return true;
  }
  TSTypeOperator(n: TSTypeOperator) {
    if (n.operator != "readonly")
      return false;
    const elementType = inferArrayLikeElementType(n.typeAnnotation);
    if (elementType)
      this.replaceNode(n, synthReadonlyArray(elementType), "operator", "typeAnnotation");
    return false;
  }
}

const transpileTs = (
  source: SourcePath,
  content: string,
  sources: SourceSet,
  unlinkedImports: ModuleImports
): string => {
  const ast = TsParser.parse(content);
  new GccTransform(source, sources, unlinkedImports).mut(ast);
  return generate(ast);
}

export { transpileTs };
