import { ModuleImports, SourceId } from "../model/moduleImport";

const toIdentifier = (source: SourceId, name: string): string => {
  const text = `kdts$$${source}$${name == "*" ? "star" : name}`;
  const value = text.replaceAll(
    /[^A-Za-z0-9_$]/g,
    (char) => (char == "." || char == "-") ? "_" : "$"
  );
  return (value[0] >= "0" && value[0] <= "9") ? "_" + value : value;
};

const removeOrigin = (source: SourceId): string =>
  source.slice(source.indexOf(":") + 1);

const generateAliasImports = (moduleImports: ModuleImports): string => {
  let out = "";
  for (const localName in moduleImports.byLocal) {
    const binding = moduleImports.byLocal[localName];
    out += "/** @const */\n";
    out += `const ${localName} = ${toIdentifier(binding.source, binding.importedName)};\n`;
  }
  return out;
};

const generateEsmImports = (moduleImports: ModuleImports): string => {
  let out = "";
  const groups = moduleImports.groupBySource();
  const emitImport = (
    source: SourceId,
    hasDefault: boolean,
    hasNamespace: boolean,
    namedImports: string[]
  ) => {
    out += "import";
    if (hasDefault)
      out += ` ${toIdentifier(source, "default")}`;
    if (hasNamespace) {
      if (hasDefault)
        out += ",";
      out += ` * as ${toIdentifier(source, "*")}`;
    } else if (namedImports.length) {
      out += hasDefault ? ", { " : " { ";
      out += namedImports.map((importedName) =>
        `${importedName} as ${toIdentifier(source, importedName)}`
      ).join(", ");
      out += " }";
    }
    out += ` from "${removeOrigin(source)}";\n`;
  };

  for (const source of Object.keys(groups).sort() as SourceId[]) {
    const imports = groups[source];
    const hasDefault = "default" in imports;
    const hasNamespace = "*" in imports;
    const namedImports = Object.keys(imports)
      .filter((importedName) => importedName != "default" && importedName != "*")
      .sort();

    if (hasNamespace && namedImports.length) {
      emitImport(source, hasDefault, true, []);
      emitImport(source, false, false, namedImports);
    } else
      emitImport(source, hasDefault, hasNamespace, namedImports);
  }
  return out;
};

export { generateAliasImports, generateEsmImports, toIdentifier };
