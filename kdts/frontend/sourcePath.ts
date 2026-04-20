import { Source } from "../model/source";

/**
 * To be consistent with bun, we guess the extension in the following order:
 *  - tsx
 *  - jsx
 *  - ts
 *  - mjs
 *  - js
 *
 * we do not support .cjs currently; all files are assumed to be modules.
 */
const JsLikeExt: readonly string[] = [".tsx", ".jsx", ".ts", ".mjs", ".js"];

const stripJsLikeExt = (path: string): string => {
  for (const ext of JsLikeExt)
    if (path.endsWith(ext)) return path.slice(0, -ext.length);
  return path;
}

const moduleAtPath = (path: string): Source => ({
  path,
  id: `module:${stripJsLikeExt(path)}`
});

export {
  JsLikeExt,
  moduleAtPath,
  stripJsLikeExt
};
