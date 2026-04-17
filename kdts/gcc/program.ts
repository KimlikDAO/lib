import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/sourceSet";

class GccProgram {
  constructor(
    readonly sourceSet = new SourceSet(),
    readonly overrides: Record<string, unknown> = {},
    readonly unlinkedImports = new ModuleImports()
  ) { }
}

export { GccProgram };
