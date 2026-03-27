import { existsSync } from "node:fs";
import { combine, getDir } from "../../util/paths";
import { SourceId } from "../model/moduleImport";

const KDTS_TYPES = "node_modules/@kimlikdao/kdts/@types/";

type SourcePath = {
  source: SourceId
  path: string,
};

/**
 * To be consistent with bun, we guess the extension in the following order:
 *  - tsx
 *  - jsx
 *  - ts
 *  - js
 */
const resolveExt = (path: string): string => {
  if (existsSync(path)) return path;
  if (existsSync(path + ".tsx")) return path + ".tsx";
  if (existsSync(path + ".jsx")) return path + ".jsx";
  if (existsSync(path + ".ts")) return path + ".ts";
  if (existsSync(path + ".js")) return path + ".js";
  return "";
}

const stripJsLikeExt = (path: string): string => {
  for (const ext of [".tsx", ".jsx", ".ts", ".js"])
    if (path.endsWith(ext))
      return path.slice(0, -ext.length);
  return path;
}

const resolvePath = (importer: string, path: string): SourcePath => {
  switch (path[0]) {
    case ".":
      path = combine(getDir(importer), stripJsLikeExt(path));
      return {
        path: resolveExt(path),
        source: `module:${path}`
      };
    case "/":
      path = stripJsLikeExt(path.slice(1));
      return {
        path: resolveExt(path),
        source: `module:${path}`
      }
    default:
      const declarationPath = resolveExt(KDTS_TYPES + path.replaceAll(":", "/") + ".d");
      if (!declarationPath) throw Error(`No types for package ${path} found!`);
      return {
        path: declarationPath,
        source: `package:${path}`
      }
  }
}

const resolveRootPath = (path: string) => resolvePath("", "./" + path);

export {
  SourcePath,
  resolvePath,
  resolveRootPath,
};
