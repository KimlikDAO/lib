import { CallExpression, ExpressionStatement, Node, parse, Program } from "acorn";
import { SourceProgram } from "../model/program";
import { CodeUpdater } from "../util/textual";
import { KdtsExportName, toMarkerBinding } from "./gccProgram";
import { generateEsmImports } from "./generator";
import { isIdentifierName } from "./names";

const isNode = (value: Node | unknown): value is Node =>
  !!value && typeof value == "object" && typeof (value as Node).type == "string";

const hasSingleDefaultExport = (program: SourceProgram): boolean =>
  program.exports.names.length == 1 && program.exports.names[0] == "default";

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

const rewriteExports = (
  content: string,
  program: SourceProgram
): string => {
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
  }) as Program;
  const updater = new CodeUpdater();
  const bindings = new Set<string>();
  const exports: string[] = [];
  const singleDefaultExport = hasSingleDefaultExport(program);

  for (const node of ast.body) {
    const marker = parseExportMarker(node);
    if (!marker)
      continue;
    const value = content.slice(marker.value.start, marker.value.end);
    if (singleDefaultExport && marker.exportName == "default") {
      updater.replace(marker.statement, `export default ${value};`);
      continue;
    }
    const binding = toMarkerBinding("__kdts_export_", marker.exportName, bindings, content);
    updater.replace(marker.statement, `const ${binding} = ${value};`);
    exports.push(`${binding} as ${marker.exportName}`);
  }

  let output = updater.apply(content);
  if (!exports.length)
    return output;
  output += `export{${exports.join(",")}}`;
  return output;
}

const postprocess = (
  content: string,
  program: SourceProgram
): string => {
  return generateEsmImports(program.imports) + rewriteExports(content, program);
};

export { postprocess };
