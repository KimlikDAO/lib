import { mkdir, readFile, writeFile } from "node:fs/promises";
import { combine, getDir } from "../util/paths";
import { transpileDeclaration } from "./transpiler/declaration";
import { transpileJs } from "./transpiler/js";
import { transpileTs } from "./transpiler/ts";
import { ImportStatement } from "./util/modules";

/**
 * @param {Record<string, unknown>} params
 * @param {(content: string, file: string, isEntry: boolean=) => string | null=} transpileFn
 * @return {Promise<{
 *   unlinkedImports: Map<string, ImportStatement>,
 *   allFiles: Set<string>,
 *   isolateDir: string,
 *   ignoreUnusedLocals: boolean
 * }>}
 */
const preprocessAndIsolate = async (params, transpileFn) => {
  const entry = /** @type {string} */(params["entry"]);
  /** @const {string} */
  const isolateDir = combine(
    getDir(/** @type {string} */(params["output"] || "build/" + entry)),
    /** @type {string} */(params["isolateDir"]) || ".kdjs_isolate");
  /** @const {Record<string, unknown>} */
  const globals = /** @type {Record<string, unknown>} */(typeof params["globals"] == "string"
    ? JSON.parse(/** @type {string} */(params["globals"])) : (params["globals"] || {}));

  /** @const {Map<string, ImportStatement>} */
  const unlinkedImports = new Map();
  /** @const {string[]} */
  const externs = params["externs"] || [];
  /** @const {string[]} */
  const files = [entry, ...externs];
  /** @const {Set<string>} */
  const allFiles = new Set();
  /** @const {Promise<void>[]} */
  const writePromises = [];
  /** @type {boolean} */
  let ignoreUnusedLocals = false;

  for (let file; file = files.pop();) {
    if (allFiles.has(file)) continue;
    allFiles.add(file);
    /** @type {string} */
    let content = await readFile(file, "utf8");
    if (file.endsWith(".d.ts"))
      content = transpileDeclaration(content, file);
    else if (file.endsWith(".ts"))
      content = transpileTs(content);
    else if (!file.endsWith(".js")) {
      if (!transpileFn) throw "For non-js files please provide a transpile function: " + file;
      /** @const {string | null} */
      const transpiled = transpileFn(content, file, file == entry);
      content = transpiled || content;
      ignoreUnusedLocals ||= !!transpiled;
    }
    content = transpileJs(file == entry, file, content, files, globals, unlinkedImports);

    const outFile = combine(isolateDir, file);
    writePromises.push(mkdir(getDir(outFile), { recursive: true })
      .catch(() => { })
      .then(() => writeFile(outFile, content)));
  }
  return Promise.all(writePromises).then(() => ({
    unlinkedImports,
    allFiles,
    isolateDir,
    ignoreUnusedLocals,
  }));
}

export { preprocessAndIsolate };
