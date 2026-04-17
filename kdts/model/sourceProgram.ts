import { ModuleExports } from "./moduleExports";
import { ModuleImports } from "./moduleImports";

interface SourceProgram {
  entry: string;
  sources: Record<string, string>;
  imports: ModuleImports;
  exports: ModuleExports;
}

export { SourceProgram };
