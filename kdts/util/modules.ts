/**
 * local: imported
 */
interface ImportStatement {
  unnamed?: string;
  isNamespace?: boolean;
  named: Record<string, string>;
  source?: string;
}

/**
 * exported: local
 */
interface ExportStatement {
  unnamed?: string;
  named: Record<string, string>;
}

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
  writeImportStatement
};
