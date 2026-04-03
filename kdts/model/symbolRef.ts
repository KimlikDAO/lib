import { SourceId } from "./moduleImports";

type SymbolRef = {
  source: SourceId;
  exportedName?: string;
};

export { SymbolRef };
