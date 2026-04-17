import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/sourceSet";

interface GccProgram {
  sourceSet: SourceSet;
  overrides: Record<string, unknown>;
  unlinkedImports: ModuleImports;
}

const createGccProgram = (
  sourceSet = new SourceSet(),
  overrides: Record<string, unknown> = {},
  unlinkedImports = new ModuleImports()
): GccProgram => ({
  sourceSet,
  overrides,
  unlinkedImports,
});

export { createGccProgram, GccProgram };
