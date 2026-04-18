import { existsSync, readFileSync, statSync } from "node:fs";
import { combine, getDir, replaceExt } from "../../util/paths";
import { SourceId, Source } from "../model/source";

const KDTS_TYPES = "node_modules/@kimlikdao/kdts/@types";

type PackageJson = {
  main?: string;
  types?: string;
  typings?: string;
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

const isFile = (path: string): boolean => {
  try {
    return !statSync(path).isDirectory();
  } catch {
    return false;
  }
}

const resolveExt = (path: string): string => {
  if (isFile(path)) return path;
  for (const ext of JsLikeExt)
    if (isFile(path + ext)) return path + ext;
  return "";
}

const stripJsLikeExt = (path: string): string => {
  for (const ext of JsLikeExt)
    if (path.endsWith(ext)) return path.slice(0, -ext.length);
  return path;
}

const resolveDeclaration = (path: string): string => {
  if (isFile(path)) return path;
  if (isFile(path + ".d.ts")) return path + ".d.ts";
  if (isFile(path + ".d.js")) return path + ".d.js";
  if (isFile(path + ".ts")) return path + ".ts";
  if (isFile(combine(path, "index.d.ts"))) return combine(path, "index.d.ts");
  if (isFile(combine(path, "index.d.js"))) return combine(path, "index.d.js");
  if (isFile(combine(path, "index.ts"))) return combine(path, "index.ts");
  return "";
}

const splitPackagePath = (path: string): [string, string] => {
  const colon = path.indexOf(":");
  const slash = path.indexOf("/");
  if (colon != -1 && (slash == -1 || colon < slash))
    return [path.slice(0, colon), "/" + path.slice(colon + 1)];

  const parts = path.split("/");
  const packageName = path.startsWith("@")
    ? parts.slice(0, 2).join("/")
    : parts[0]!;
  return [packageName, path.slice(packageName.length)];
}

const resolveRootImport = (packageDir: string, packageJson: PackageJson): string => {
  const declarationPath = packageJson.types
    || packageJson.typings
    || (packageJson.main && replaceExt(packageJson.main, ".d.ts"))
    || "index";
  return resolveDeclaration(combine(packageDir, declarationPath));
}

const moduleAtPath = (path: string): Source => ({
  path,
  id: `module:${stripJsLikeExt(path)}`
});

const resolvePackage = (
  modulesPath: string,
  packagePath: string
): string => {
  const [packageName, subpath] = splitPackagePath(packagePath);
  const packageDir = combine(modulesPath, packageName);
  if (!existsSync(packageDir))
    return "";

  const packageJsonPath = combine(packageDir, "package.json");
  if (!isFile(packageJsonPath))
    throw Error(`Package ${packageName} is missing package.json`);

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
  return subpath
    ? resolveDeclaration(combine(packageDir, subpath.slice(1)))
    : resolveRootImport(packageDir, packageJson);
}

const resolvePath = (importer: string, path: string): Source => {
  switch (path[0]) {
    case ".":
      return moduleAtPath(resolveExt(combine(getDir(importer), path)));
    case "/":
      return moduleAtPath(resolveExt(path.slice(1)));
    default:
      const packagePath = path;
      const id: SourceId = `package:${packagePath}`;
      for (const nodeModulesPath of [KDTS_TYPES, "node_modules"]) {
        const resolvedPath = resolvePackage(nodeModulesPath, packagePath);
        if (resolvedPath)
          return { path: resolvedPath, id };
      }
      throw Error(`No types for package ${packagePath} found!`);
  }
}

const resolveRootPath = (path: string) => resolvePath("", "./" + path);

export {
  resolvePath,
  resolveRootPath
};
