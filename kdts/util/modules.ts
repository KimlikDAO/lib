/**
 * Compact semantic import representation.
 *
 * `named` maps local name -> imported name.
 */
interface ImportStatement {
  unnamed?: string;
  isNamespace?: boolean;
  named: Record<string, string>;
  source?: string;
}

/**
 * Compact semantic export representation.
 *
 * `named` maps exported name -> local name.
 */
interface ExportStatement {
  unnamed?: string;
  named: Record<string, string>;
}

const createImportStatement = (): ImportStatement => ({
  named: {},
});

const createExportStatement = (): ExportStatement => ({
  named: {},
});

const writeImportStatement = (
  importStmt: ImportStatement,
  source: string
): string => {
  let out = "import";
  if (importStmt.unnamed)
    out += (importStmt.isNamespace ? " *as " : " ") + importStmt.unnamed
  const named = Object.entries(importStmt.named);
  if (named.length) {
    named.sort((a, b) => a[0].localeCompare(b[0]));
    out += importStmt.unnamed ? ",{" : "{";
    out += named.map((dec) => !dec[1] || dec[0] == dec[1]
      ? dec[0] : `${dec[1]} as ${dec[0]}`)
      .join(",") + "}from";
  } else if (importStmt.unnamed) out += " from";
  return out + `"${source}";`;
}

export {
  ExportStatement,
  ImportStatement,
  createExportStatement,
  createImportStatement,
  writeImportStatement
};
