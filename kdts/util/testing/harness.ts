import { expect } from "bun:test";
import { SourceSet } from "../../frontend/sourceSet";
import { ModuleImports } from "../../model/moduleImports";
import { Source } from "../../model/source";
import { stripIndent } from "./source";

type TranspileSourceFn = (
  source: Source,
  content: string,
  sources: SourceSet,
  overrides: Record<string, unknown>,
  imports: ModuleImports
) => string;

type TranspileDeclarationFn = (
  source: Source,
  content: string,
  sources: SourceSet
) => string;

type TranspileFn = (
  source: Source,
  content: string,
  sources: SourceSet,
  overrides?: Record<string, unknown>,
  imports?: ModuleImports
) => string;

type ExpectEmitFn = (src: string, emit: string) => void;

interface HarnessSourceOptions {
  overrides?: Record<string, unknown>,
  unlinkedImports?: ModuleImports
}

const harnessSourceFn = (
  transpileSourceFn: TranspileSourceFn
): (src: string, emit: string, options?: HarnessSourceOptions) => void => {
  return (src: string, emit: string, options: HarnessSourceOptions = {}) => {
    const out = transpileSourceFn({
      id: "module:test",
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
      id: "module:test.d",
      path: "/test.d.ts"
    },
      src,
      new SourceSet()
    );
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
