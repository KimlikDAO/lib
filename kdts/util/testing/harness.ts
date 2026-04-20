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

type ExpectEmitFn = (src: string, emit: string) => void;
type ExpectEmitSourceFn = (
  src: string,
  emit: string,
  options?: HarnessSourceOptions
) => void;

interface HarnessSourceOptions {
  overrides?: Record<string, unknown>,
  unlinkedImports?: ModuleImports
}

const harnessSourceFn = (
  transpileSourceFn: TranspileSourceFn
): ExpectEmitSourceFn => {
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

const isTranspileDeclarationFn = (
  transpileFn: TranspileSourceFn | TranspileDeclarationFn
): transpileFn is TranspileDeclarationFn => transpileFn.length == 3;

function harness(transpileFn: TranspileSourceFn): ExpectEmitSourceFn;
function harness(transpileFn: TranspileDeclarationFn): ExpectEmitFn;
function harness(
  transpileFn: TranspileSourceFn | TranspileDeclarationFn
): ExpectEmitFn | ExpectEmitSourceFn {
  if (isTranspileDeclarationFn(transpileFn))
    return harnessDeclarationFn(transpileFn);
  return harnessSourceFn(transpileFn);
}

export {
  harness,
  harnessDeclarationFn,
  harnessSourceFn
};
