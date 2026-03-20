import {
  Options as AcornOptions,
  AssignmentExpression,
  Identifier,
  Literal,
  Node,
  ObjectExpression,
  parse,
  Program,
  Property,
} from "acorn";
import { Options as AstringOptions, generate } from "astring";
import { ImportStatement, writeImportStatement } from "../util/modules";
import { Update, update } from "../util/textual";

const ASTRING_OPTIONS: AstringOptions = {
  indent: "",
  lineEnd: "",
};

const ACORN_OPTIONS: AcornOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
};

const generateImports = (imports: Map<string, ImportStatement>): string => {
  const entries = Array.from(imports.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries
    .map(([source, importStmt]) => writeImportStatement(importStmt, source))
    .join("");
};

const isIdentifier = (node: Node): node is Identifier =>
  node.type == "Identifier";

const isLiteral = (node: Node): node is Literal =>
  node.type == "Literal";

const isExportTargetAssignment = (
  node: AssignmentExpression
): node is AssignmentExpression & {
  left: AssignmentExpression["left"] & {
    type: "MemberExpression";
    object: Identifier;
    property: Identifier;
  };
  right: ObjectExpression;
} =>
  node.left.type == "MemberExpression"
  && !node.left.computed
  && isIdentifier(node.left.object)
  && isIdentifier(node.left.property)
  && node.left.object.name == "globalThis"
  && node.left.property.name == "KimlikDAOCompiler_exports"
  && node.right.type == "ObjectExpression";

const getExportName = (prop: Property): string => {
  if (isIdentifier(prop.key))
    return prop.key.name;
  if (isLiteral(prop.key))
    return String(prop.key.value);
  return generate(prop.key, ASTRING_OPTIONS);
};

const isExportTargetAssignmentStatement = (
  node: Program["body"][number]
): node is Program["body"][number] & {
  type: "ExpressionStatement";
  expression: AssignmentExpression & {
    left: AssignmentExpression["left"] & {
      type: "MemberExpression";
      object: Identifier;
      property: Identifier;
    };
    right: ObjectExpression;
  };
} =>
  node.type == "ExpressionStatement"
  && node.expression.type == "AssignmentExpression"
  && isExportTargetAssignment(node.expression);

const postprocess = (
  content: string,
  missingImports: Map<string, ImportStatement>
): string => {
  const ast = parse(content, ACORN_OPTIONS) as Program;
  const updates: Update[] = [];
  let assignmentCode = "";
  let exportCode = "";

  for (const node of ast.body) {
    if (!isExportTargetAssignmentStatement(node))
      continue;
    const assignment = node.expression;

    const exportCount = assignment.right.properties.length;
    if (exportCount == 1
      && assignment.right.properties[0].type == "Property"
      && getExportName(assignment.right.properties[0]) == "KDdefault")
      exportCode = `export default ${generate(assignment.right.properties[0].value, ASTRING_OPTIONS)}`;
    else if (exportCount > 0) {
      exportCode = "export{";
      for (const prop of assignment.right.properties) {
        if (prop.type != "Property")
          continue;
        const prefix = "KimlikDAOCompiler_";
        let exportName = getExportName(prop);
        if (exportName == "KDdefault")
          exportName = exportName.slice(2);
        assignmentCode += `const ${prefix}${exportName} = ${generate(prop.value, ASTRING_OPTIONS)};\n`;
        exportCode += `${prefix}${exportName} as ${exportName},`;
      }
      exportCode = exportCode.slice(0, -1) + "}";
    }
    updates.push({
      beg: assignment.start,
      end: assignment.end,
      put: "",
    });
  }

  const newContent = generateImports(missingImports) + update(content, updates);
  return newContent + assignmentCode + exportCode;
};

export { postprocess };
