import { existsSync } from "node:fs";

/**
 * To be consistent with bun, we guess the extension in the following order:
 *  - tsx
 *  - jsx
 *  - ts
 *  - js
 *
 * @param {string} fileName
 * @return {string}
 */
const resolveExtension = (fileName) => {
  if (existsSync(fileName)) return fileName;
  // if (existsSync(fileName + ".tsx")) return fileName + ".tsx";
  if (existsSync(fileName + ".jsx")) return fileName + ".jsx";
  if (existsSync(fileName + ".ts")) return fileName + ".ts";
  if (existsSync(fileName + ".js")) return fileName + ".js";
  return fileName;
}

export { resolveExtension };
