type ModuleImportBinding = {
  source: string;
  importedName: string;
};

class ModuleImports {
  readonly byLocal: Record<string, ModuleImportBinding> = {};

  add(localName: string, source: string, importedName: string): this {
    this.byLocal[localName] = { source, importedName };
    return this;
  }
}

class ModuleExports {
  readonly byExported: Record<string, string> = {};

  add(localName: string, exportedName: string) {
    this.byExported[exportedName] = localName;
  }
}

export {
  ModuleExports,
  ModuleImportBinding,
  ModuleImports,
};
