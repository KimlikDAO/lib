import { ImportDeclaration } from "acorn";

type SourceId = `package:${string}` | `module:${string}`;

type ImportBinding = {
  source: SourceId;
  importedName: string;
};

class ModuleImports {
  readonly byLocal: Record<string, ImportBinding> = {};

  add(node: ImportDeclaration, source?: SourceId) {
    source ??= `module:${node.source.value}`;
    for (const specifier of node.specifiers) {
      const localName = specifier.local.name;
      let importedName = "";
      switch (specifier.type) {
        case "ImportNamespaceSpecifier":
          importedName = "*";
          break;
        case "ImportDefaultSpecifier":
          importedName = "default";
          break;
        case "ImportSpecifier":
          importedName = specifier.imported.type == "Identifier"
            ? specifier.imported.name
            : String(specifier.imported.value);
          break;
        default:
          continue;
      }

      this.byLocal[localName] = { source, importedName };
    }
  }

  groupBySource(): Record<SourceId, Record<string, string>> {
    const groups = {} as Record<SourceId, Record<string, string>>;
    for (const localName in this.byLocal) {
      const { source, importedName } = this.byLocal[localName];
      (groups[source] ||= {})[importedName] = localName;
    }
    return groups;
  }
}

export { ModuleImports, SourceId };
