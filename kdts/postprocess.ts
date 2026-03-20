import {
  Options as AcornOptions,
  AssignmentExpression,
  Identifier,
  Literal,
  Node,
  ObjectExpression,
  parse,
  Property,
} from "acorn";
import { simple } from "acorn-walk";
import { Options as AstringOptions, generate } from "astring";
import { ImportStatement, writeImportStatement } from "./util/modules";
import { Update, update } from "./util/textual";

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

const postprocess = (
  content: string,
  missingImports: Map<string, ImportStatement>
): string => {
  const ast = parse(content, ACORN_OPTIONS);
  const updates: Update[] = [];
  let assignmentCode = "";
  let exportCode = "";

  simple(ast, {
    AssignmentExpression(node) {
      if (!isExportTargetAssignment(node))
        return;

      const exportCount = node.right.properties.length;
      if (exportCount == 1
        && node.right.properties[0].type == "Property"
        && getExportName(node.right.properties[0]) == "KDdefault")
        exportCode = `export default ${generate(node.right.properties[0].value, ASTRING_OPTIONS)}`;
      else if (exportCount > 0) {
        exportCode = "export{";
        for (const prop of node.right.properties) {
          if (prop.type !== "Property")
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
        beg: node.start,
        end: node.end,
        put: "",
      });
    },
  });

  const newContent = generateImports(missingImports) + update(content, updates);
  return newContent + assignmentCode + exportCode;
};

export { postprocess };
