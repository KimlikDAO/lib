import {
  ArrowFunctionExpression,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  Node,
  Program,
  VariableDeclaration
} from "acorn";
import { getExt } from "../util/paths";
import { isIdentifier, isSatisfiesExpression, typeReferenceName } from "../ast/guards";
import {
  probeArrayLikeElementType,
  probeExpressionType,
  probeTypeReferenceArg
} from "../ast/probe";
import {
  Expression,
  ReturnStatement,
  TSAsExpression,
  TSTypeAnnotation,
  TSTypeOperator,
  TSTypeReference,
  VariableDeclarator
} from "../ast/types";
import { Mutator } from "../ast/walk";
import { resolvePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { Modifier } from "../model/modifier";
import { ModuleImports } from "../model/moduleImports";
import { Source } from "../model/source";
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
    protected readonly source: Source,
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
  private readonly returnTypes: (TSTypeReference | undefined)[] = [];

  constructor(
    source: Source,
    sources: SourceSet,
    private readonly overrides: Record<string, unknown>,
    private readonly imports: ModuleImports
  ) { super(source, sources); }

  private declaredReturnType(
    n: { async?: boolean; returnType?: TSTypeAnnotation }
  ): TSTypeReference | undefined {
    if (n.async)
      return;
    const type = n.returnType?.typeAnnotation;
    return type?.type == "TSTypeReference" ? type : undefined;
  }
  private wrapWithReturnType(n: Expression | null | undefined): Expression | null | undefined {
    const returnType = this.returnTypes[this.returnTypes.length - 1];
    if (!returnType || n?.type != "ObjectExpression")
      return n;
    return {
      type: "TSAsExpression",
      expression: n as Expression,
      typeAnnotation: returnType
    } as TSAsExpression;
  }
  private withDeclaredReturnType(
    n: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
  ): true {
    this.returnTypes.push(this.declaredReturnType(n));
    if (n.type == "ArrowFunctionExpression" && n.body.type == "ObjectExpression")
      n.body = this.wrapWithReturnType(n.body) as ArrowFunctionExpression["body"];
    this.mutChildren(n);
    this.returnTypes.pop();
    return true;
  }

  FunctionDeclaration(n: FunctionDeclaration) {
    return this.withDeclaredReturnType(n);
  }
  FunctionExpression(n: FunctionExpression) {
    return this.withDeclaredReturnType(n);
  }
  ArrowFunctionExpression(n: ArrowFunctionExpression) {
    return this.withDeclaredReturnType(n);
  }
  ReturnStatement(n: ReturnStatement) {
    n.argument = this.wrapWithReturnType(n.argument);
    return false;
  }
  VariableDeclaration(n: VariableDeclaration) {
    for (const declaration of n.declarations)
      this.mut(declaration, n.kind);
    return true;
  }
  VariableDeclarator(n: VariableDeclarator, declarationKind?: VariableDeclaration["kind"]) {
    const init: Node | null | undefined = n.init;
    const explicitType = n.id.typeAnnotation?.typeAnnotation;

    if (isSatisfiesExpression(init)) {
      const marker = typeReferenceName(init.typeAnnotation);
      if (marker == "LargeConstant") {
        n.modifiers = (n.modifiers ?? 0) | Modifier.NoInline;
        n.init = init.expression;
      } else if (marker == "Overridable" && isIdentifier(n.id)) {
        if (declarationKind != "const")
          throw "Overridable declarations must use const";
        if (!Object.hasOwn(this.overrides, n.id.name)) return;
        const type = explicitType || probeExpressionType(init.expression);
        n.init = {
          type: "TSAsExpression",
          expression: synthJsonValue(this.overrides[n.id.name]),
          typeAnnotation: type
        } as unknown as VariableDeclarator["init"];
      }
    } else if (explicitType && init?.type == "ObjectExpression") {
      n.init = {
        type: "TSAsExpression",
        expression: init,
        typeAnnotation: explicitType
      } as unknown as VariableDeclarator["init"];
    }
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

    if (resolvedImport.id.startsWith("package:"))
      this.imports.add(n, resolvedImport.id);
    if (resolvedImport.path.endsWith(".d.ts")) {
      this.typeOnlyImports.add(n, resolvedImport.id);
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
    this.typeOnlyImports.add(n, resolvedImport.id);
    return false;
  }
  ExportNamedDeclaration(n: ExportNamedDeclaration) { console.log(n); }
  ExportDefaultDeclaration(n: ExportDefaultDeclaration) {
    this.replaceNode(
      n,
      synthVariableDeclaration(
        synthIdentifier("default", {
          source: this.source.id,
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
