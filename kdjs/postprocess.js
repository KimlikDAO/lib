import { parse } from "acorn";
import { simple } from "acorn-walk";
import { generate } from "astring";
import { ImportStatement, writeImportStatement } from "./modules";
import { Update, update } from "./textual";

const generateImports = (imports) => {
  const entries = Array.from(imports.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries
    .map(([source, importStmt]) => writeImportStatement(importStmt, source))
    .join("");
}

/**
 * @param {string} content
 * @param {!Map<string, ImportStatement>} missingImports
 */
const postprocess = (content, missingImports) => {
  /** @const {!acorn.Program} */
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module"
  });
  /**
   * @const
   * @type {!Array<Update>}
   */
  const updates = [];
  let assignmentCode = "";
  let exportCode = "";

  simple(ast, /** @type {!acorn.SimpleVisitor} */({
    Literal(node) {
      if (typeof node.value === 'bigint') {
        const decimal = node.value.toString();
        const hexadecimal = '0x' + node.value.toString(16);
        if (hexadecimal.length < decimal.length)
          updates.push({
            beg: node.start,
            end: node.end,
            put: hexadecimal + "n"
          })
      }
    },
    AssignmentExpression(node) {
      if (node.left.type === 'MemberExpression' &&
        node.left.object.name === 'globalThis' &&
        node.left.property.name === 'KimlikDAOCompiler_exports') {
        const exportCount = node.right.properties.length;
        if (exportCount == 1 && node.right.properties[0].key.name == "KDdefault") {
          exportCode = `export default ${generate(node.right.properties[0].value)}`;
        } else if (exportCount > 0) {
          exportCode = "export{";
          node.right.properties.forEach((prop) => {
            const prefix = 'KimlikDAOCompiler_';
            let exportName = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
            if (exportName == "KDdefault") exportName = exportName.slice(2);
            assignmentCode += `const ${prefix}${exportName} = ${generate(prop.value)};\n`;
            exportCode += `${prefix}${exportName} as ${exportName},`;
          });
          exportCode = exportCode.slice(0, -1) + "}";
        }
        updates.push({
          beg: node.start,
          end: node.end,
          put: ""
        })
      }
    }
  }));
  const newContent = generateImports(missingImports) + update(content, updates);
  return newContent + assignmentCode + exportCode;
}

export { postprocess };
