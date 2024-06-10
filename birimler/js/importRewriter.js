import { simple } from "acorn-walk";
import { Bun } from "bun";
import { Parser } from "acorn";


/**
 * @param {string} fileName
 * @return {string} directory of the fileName
 */
const getDir = (fileName) => fileName.slice(0, fileName.lastIndexOf("/"));

const removeMissingImports = async (fileName, missingMap, isolatePrefix) => {
  const fileDir = getDir(fileName);
  const content = await Bun.file(fileName).text();

  const parser = Parser();
  const ast = parser.parse(content, {
    ecmaVersion: "latest",
    sourceType: "module"
  });

  simple(ast, {
    ImportDeclaration(node) {
      const importPath = resolveFilePath(fileDir, node.source.value);
      if (!fs.existsSync(importPath) && !fs.existsSync(`${importPath}.js`)) {
        const missingSymbols = node.specifiers.map(specifier => specifier.imported.name);
        missingImports.set(filePath, missingSymbols);

        // Replace the import statement with an empty line (not removing to keep line numbers consistent for easier debugging)
        modifiedContent = modifiedContent.substring(0, node.start) + '\n'.repeat(node.end - node.start) + modifiedContent.substring(node.end);
      }
    }
  })
}

export {
  getDir,
  removeMissingImports,
};
