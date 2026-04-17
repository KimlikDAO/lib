import { expect } from "bun:test";
import { SourcePath } from "../../frontend/resolver";
import { SourceSet } from "../../model/sourceSet";
import { ModuleImports } from "../../model/moduleImports";
import { GccProgram } from "../../gcc/program";
import { stripIndent } from "./source";

interface TranspileSourceFn {
  (source: SourcePath, content: string, program: GccProgram): string;
}

interface TranspileDeclarationFn {
  (source: SourcePath, content: string, program: GccProgram): string;
}

interface ExpectEmitFn {
  (src: string, emit: string): void;
}

interface HarnessSourceOptions {
  overrides?: Record<string, unknown>,
  unlinkedImports?: ModuleImports
}

const harnessSourceFn = (
  transpileSourceFn: TranspileSourceFn
): (src: string, emit: string, options?: HarnessSourceOptions) => void => {
  return (src: string, emit: string, options: HarnessSourceOptions = {}) => {
    const out = transpileSourceFn(
      {
        source: "module:test",
        path: "/test.ts"
      },
      src,
      new GccProgram(
        new SourceSet(),
        options.overrides || {},
        options.unlinkedImports || new ModuleImports()
      )
    );
    expect(out).toBe(stripIndent(emit));
  }
}

const harnessDeclarationFn = (
  transpileDeclarationFn: TranspileDeclarationFn
): ExpectEmitFn => {
  return (src: string, emit: string) => {
    const out = transpileDeclarationFn({
      source: "module:test.d",
      path: "/test.d.ts"
    }, src, new GccProgram(new SourceSet()));
    expect(out).toBe(stripIndent(emit));
  }
}

const harness = (transpileFn: TranspileSourceFn): ExpectEmitFn =>
  harnessSourceFn(transpileFn);

export {
  harness,
  harnessDeclarationFn,
  harnessSourceFn
};
