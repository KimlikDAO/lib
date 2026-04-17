import { ModuleExports } from "./moduleExports";
import { ModuleImports } from "./moduleImports";

interface SourceProgram {
  entry: string;
  sources: string[];
  imports: ModuleImports;
  exports: ModuleExports;
}

interface DiskProgram extends SourceProgram {
  isolateDir: string;
}

export { DiskProgram, SourceProgram };
