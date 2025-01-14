import { combine, getDir } from "../util/paths";

/**
 * TODO(KimlikDAO-bot): Fix this
 * @param {string} fileName
 * @return {string}
 */
const ensureExtension = (fileName) => fileName.endsWith(".js") || fileName.endsWith(".jsx") || fileName.endsWith(".css")
  ? fileName : fileName + ".js";

/**
 * @param {string} file name of the file
 * @param {string} content of the file
 * @param {!Array<string>} files
 * @return {string} file after preprocessing
 */
const processJsx = (file, content, files) => {
  /** @const {!Array<string>} */
  const lines = content.split("\n");
  /** @const {!Array<string>} */
  const result = [];

  let out = "";
  for (let i = 0; i < lines.length; ++i)
    if (lines[i].trim().startsWith("export const")) {
      if (i > 0) result.push(lines[i - 1]);
      result.push(lines[i]);
    } else if (lines[i].includes("import") && (lines[i].includes("util/dom") || lines[i].includes(".css"))) {
      const importName = lines[i].slice(
        lines[i].indexOf('"') + 1,
        lines[i].lastIndexOf('"'));
      files.push(importName.at(0) == "/"
        ? ensureExtension(importName.slice(1))
        : ensureExtension(combine(getDir(file), importName)));
      out += lines[i] + "\n";
    }
  return out + "\n" + result.join("\n");
};

export { processJsx };
