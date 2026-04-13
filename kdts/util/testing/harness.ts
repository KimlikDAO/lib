import { expect } from "bun:test";
import { SourcePath } from "../../frontend/resolver";
import { SourceSet } from "../../model/sourceSet";
import { ModuleImports } from "../../model/moduleImports";
import { stripIndent } from "./source";

type TranspileSourceFn = (
  source: SourcePath,
  content: string,
  sources: SourceSet,
  globals: Record<string, unknown>,
  unlinkedImports: ModuleImports
) => string;

type TranspileDeclarationFn = (
  source: SourcePath,
  content: string,
  sources: SourceSet
) => string;

type TranspileFn = TranspileSourceFn | TranspileDeclarationFn;

type ExpectEmitFn = (src: string, emit: string) => void;

type HarnessSourceOptions = {
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
      new SourceSet(),
      options.overrides || {},
      options.unlinkedImports || new ModuleImports()
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
    }, src, new SourceSet());
    expect(out).toBe(stripIndent(emit));
  }
}

const harness = (transpileFn: TranspileFn): ExpectEmitFn => {
  if (transpileFn.length == 3)
    return harnessDeclarationFn(transpileFn as TranspileDeclarationFn);
  return harnessSourceFn(transpileFn as TranspileSourceFn);
}

export {
  harness,
  harnessDeclarationFn,
  harnessSourceFn
};
