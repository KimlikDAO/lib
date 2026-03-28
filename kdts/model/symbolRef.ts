import { SourceId } from "./moduleImport";

type SymbolRef = {
  source: SourceId;
  exportedName?: string;
};

export { SymbolRef };
