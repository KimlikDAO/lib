import { SourceId } from "./source";

type SymbolRef = {
  source: SourceId;
  exportedName?: string;
};

export { SymbolRef };
