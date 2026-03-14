import process from "node:process";

/**
 * @param {string} code
 * @param {string=} path
 * @return {Promise<unknown>}
 */
const importCode = (code, path = "") => import(
  URL.createObjectURL(new File([code], path, { type: "application/javascript+module" })));

/**
 * @param {Error} error
 * @param {number=} depth
 * @return {string}
 */
const fileFromError = (error, depth = 1) => {
  const lines = (error.stack ?? "").split('\n');

  const line = lines[depth];
  if (!line) return "";

  const cwd = process.cwd();

  if (depth === 1) {
    // First line has parens: "at css (/path/to/file.js:120:38)" or "at <anonymous> (/path/to/file.js)"
    const match = line.match(/\((.+?)(:\d+:\d+)?\)/);
    if (!match) return "";
    const fullPath = match[1];
    return fullPath.startsWith(cwd)
      ? fullPath.slice(cwd.length + 1)
      : fullPath;
  } else {
    // Other lines: "at /path/to/file.js:120:38" or "at /path/to/file.js"
    const match = line.match(/at\s+(.+?)(:\d+:\d+)?$/);
    if (!match) return "";
    const fullPath = match[1];
    return fullPath.startsWith(cwd)
      ? fullPath.slice(cwd.length + 1)
      : fullPath;
  }
};

export { fileFromError, importCode };
