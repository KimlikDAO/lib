import {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Identifier,
  ImportDeclaration,
  Node,
  Program
} from "acorn";
import { getExt } from "../../util/paths";
import { isIdentifier, isSatisfiesExpression, typeReferenceName } from "../ast/guards";
import {
  probeArrayLikeElementType,
  probeExpressionType,
  probeTypeReferenceArg
} from "../ast/probe";
import { TSTypeOperator, TSTypeReference, VariableDeclarator } from "../ast/types";
import { Mutator } from "../ast/walk";
import { resolvePath, SourcePath } from "../frontend/resolver";
import { SourceSet } from "../model/sourceSet";
import { Modifier } from "../model/modifier";
import { ModuleImports } from "../model/moduleImports";
import {
  synthAliasImports,
  synthComment,
  synthIdentifier,
  synthJsonValue,
  synthReadonlyArray,
  synthVariableDeclaration
} from "./synthesize";

const NameMap: Record<string, string> = {
  "Record": "Object",
  "PromiseSettledResult": "Promise.AllSettledResultElement",
  "RsaHashedImportParams": "webCrypto.RsaHashedImportParams",
  "PromiseLike": "IThenable"
};

class GccTransform extends Mutator {
  readonly typeOnlyImports = new ModuleImports();

  constructor(
    protected readonly source: SourcePath,
    protected readonly sources: SourceSet,
  ) { super(); }

  Identifier(n: Identifier) {
    if (Object.hasOwn(NameMap, n.name))
      n.name = NameMap[n.name];
  }
  TSTypeReference(n: TSTypeReference) {
    const inner = probeTypeReferenceArg(n, "Partial", 0);
    if (inner)
      this.replaceNode(n, inner, "typeName", "typeArguments");
    return false;
  }
  TSTypeOperator(n: TSTypeOperator) {
    if (n.operator != "readonly")
      return false;
    const elementType = probeArrayLikeElementType(n.typeAnnotation);
    if (elementType)
      this.replaceNode(n, synthReadonlyArray(elementType), "operator", "typeAnnotation");
    return false;
  }
}

class GccJsTransform extends GccTransform {
  constructor(
    source: SourcePath,
    sources: SourceSet,
    private readonly overrides: Record<string, unknown>,
    private readonly unlinkedImports: ModuleImports
  ) { super(source, sources); }

  VariableDeclarator(n: VariableDeclarator) {
    const init: Node | null | undefined = n.init;
    const explicitType = n.id.typeAnnotation?.typeAnnotation;
    if (!isSatisfiesExpression(init)) {
      if (explicitType && init?.type == "ObjectExpression") {
        n.init = {
          type: "TSAsExpression",
          expression: init,
          typeAnnotation: explicitType
        } as unknown as VariableDeclarator["init"];
      }
      return;
    }
    const marker = typeReferenceName(init.typeAnnotation);
    if (marker == "LargeConstant") {
      n.modifiers = (n.modifiers ?? 0) | Modifier.NoInline;
      n.init = init.expression;
      return;
    }
    if (marker != "Overridable" || !isIdentifier(n.id) ||
      !Object.hasOwn(this.overrides, n.id.name))
      return;
    const type = explicitType || probeExpressionType(init.expression);
    n.init = {
      type: "TSAsExpression",
      expression: synthJsonValue(this.overrides[n.id.name]),
      typeAnnotation: type
    } as unknown as VariableDeclarator["init"];
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
    if (aliasImports.length)
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
}

class GccExternTransform extends GccTransform {
  Program(n: Program) {
    const body: Program["body"] = [];
    for (const child of n.body) {
      if (child.type == "ImportDeclaration") {
        this.mut(child);
        continue;
      }
      if (child.type == "ExportNamedDeclaration") {
        const declaration = (child as ExportNamedDeclaration).declaration;
        if (!declaration)
          continue;
        this.mut(declaration);
        body.push(declaration as Program["body"][number]);
        continue;
      }
      this.mut(child);
      body.push(child as Program["body"][number]);
    }
    n.body = body;
    return true;
  }
  ImportDeclaration(n: ImportDeclaration) {
    const importSource = "" + n.source.value;
    const resolvedImport = resolvePath(this.source.path, importSource);
    if (resolvedImport.path.endsWith(".ts") && !resolvedImport.path.endsWith(".d.ts"))
      throw "d.ts importing .ts is banned";
    this.sources.add(resolvedImport);
    this.typeOnlyImports.add(n, resolvedImport.source);
    return false;
  }
  ExportNamedDeclaration(n: ExportNamedDeclaration) { console.log(n); }
  ExportDefaultDeclaration(n: ExportDefaultDeclaration) {
    this.replaceNode(
      n,
      synthVariableDeclaration(
        synthIdentifier("default", {
          source: this.source.source,
          exportedName: "default",
        }),
        n.declaration,
        "const",
        Modifier.ClosureNamespace
      ),
      "declaration",
      "exportKind"
    );
  }
}

export { GccExternTransform, GccJsTransform, GccTransform };
