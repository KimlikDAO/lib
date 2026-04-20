import { CallExpression, ExpressionStatement, Node, parse, Program } from "acorn";
import { ModuleImports } from "../model/moduleImports";
import { CodeUpdater } from "../util/textual";
import {
  isIdentifierName,
  KdtsExportName,
  toMarkerBinding
} from "./exportMarker";
import { generateEsmImports } from "./generator";

const isNode = (value: Node | unknown): value is Node =>
  !!value && typeof value == "object" && typeof (value as Node).type == "string";

const parseExportMarker = (
  node: Node | null | undefined
): { exportName: string, value: Node, statement: ExpressionStatement } | void => {
  if (!node || node.type != "ExpressionStatement")
    return;
  const statement = node as ExpressionStatement;
  const expression = statement.expression;
  if (expression.type != "CallExpression")
    return;
  const call = expression as CallExpression;
  if (call.callee.type != "Identifier" || call.callee.name != KdtsExportName)
    return;
  if (call.arguments.length != 2)
    throw Error(`Malformed ${KdtsExportName} marker`);

  const [exportName, value] = call.arguments;
  if (exportName?.type != "Literal" || typeof exportName.value != "string")
    throw Error(`Malformed ${KdtsExportName} marker`);
  if (!isNode(value))
    throw Error(`Malformed ${KdtsExportName} marker`);
  if (exportName.value != "default" && !isIdentifierName(exportName.value))
    throw Error(`Unsupported export name ${JSON.stringify(exportName.value)}`);
  return {
    exportName: exportName.value,
    value,
    statement
  };
}

const rewriteExports = (content: string): string => {
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
  }) as Program;
  const updater = new CodeUpdater();
  const bindings = new Set<string>();
  const exports: string[] = [];

  for (const node of ast.body) {
    const marker = parseExportMarker(node);
    if (!marker)
      continue;
    const binding = toMarkerBinding("__kdts_export_", marker.exportName, bindings, content);
    const value = content.slice(marker.value.start, marker.value.end);
    updater.replace(marker.statement, `const ${binding} = ${value};`);
    exports.push(`${binding} as ${marker.exportName}`);
  }

  let output = updater.apply(content);
  if (!exports.length)
    return output;
  if (!output.endsWith("\n"))
    output += "\n";
  output += `export { ${exports.join(", ")} };`;
  return output;
}

const postprocess = (
  content: string,
  unlinkedImports: ModuleImports
): string => {
  return generateEsmImports(unlinkedImports) + rewriteExports(content);
};

export { postprocess };
