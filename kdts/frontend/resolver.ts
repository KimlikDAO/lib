import { existsSync, readFileSync } from "node:fs";
import { combine, getDir, replaceExt } from "../../util/paths";
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
 *  - mjs
 *  - js
 * 
 * we do not support .cjs currently; all files are assumed to be modules.
 */
const JsLikeExt: readonly string[] = [".tsx", ".jsx", ".ts", ".mjs", ".js"];

const resolveExt = (path: string): string => {
  if (existsSync(path)) return path;
  for (const ext of JsLikeExt)
    if (existsSync(path + ext)) return path + ext;
  return "";
}

const stripJsLikeExt = (path: string): string => {
  for (const ext of JsLikeExt)
    if (path.endsWith(ext)) return path.slice(0, -ext.length);
  return path;
}

const resolveDeclaration = (path: string): string => {
  if (existsSync(path)) return path;
  if (existsSync(path + ".d.ts")) return path + ".d.ts";
  if (existsSync(path + ".ts")) return path + ".ts";
  if (existsSync(combine(path, "index.d.ts"))) return combine(path, "index.d.ts");
  if (existsSync(combine(path, "index.ts"))) return combine(path, "index.ts");
  return "";
}

const splitPackagePath = (path: string): [string, string] => {
  const parts = path.split("/");
  const packageName = path.startsWith("@")
    ? parts.slice(0, 2).join("/")
    : parts[0]!;
  return [packageName, path.slice(packageName.length)];
}

const resolvePath = (importer: string, path: string): SourcePath => {
  switch (path[0]) {
    case ".":
      path = resolveExt(combine(getDir(importer), path));
      return {
        path,
        source: `module:${stripJsLikeExt(path)}`
      };
    case "/":
      path = resolveExt(path.slice(1));
      return {
        path,
        source: `module:${stripJsLikeExt(path)}`
      }
    default:
      const source: SourceId = `package:${path}`;
      const packagePath = path;
      path = resolveExt(KDTS_TYPES + packagePath.replaceAll(":", "/") + ".d");
      if (!path) {
        const [packageName, subpath] = splitPackagePath(packagePath);
        if (subpath)
          path = resolveDeclaration(`node_modules/${packagePath}`);
        else {
          const packageJson = JSON.parse(
            readFileSync(`node_modules/${packageName}/package.json`, "utf8")
          ) as {
            main?: string,
            types?: string,
            typings?: string,
          };
          const declarationPath = packageJson.types
            || packageJson.typings
            || (packageJson.main && replaceExt(packageJson.main, ".d.ts"))
            || "index.d.ts";
          path = resolveDeclaration(combine(`node_modules/${packageName}`, declarationPath));
        }
      }
      if (!path) throw Error(`No types for package ${packagePath} found!`);
      return { path, source }
  }
}

const resolveRootPath = (path: string) => resolvePath("", "./" + path);

export {
  SourcePath,
  resolvePath,
  resolveRootPath
};
