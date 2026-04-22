/**
 * Returns the directory portion of a path, excluding the final slash.
 *
 * @example
 * ```ts
 * getDir("src/util/paths.ts") == "src/util"
 * ```
 *
 * @satisfies {PureFn}
 */
const getDir = (fileName: string): string =>
  fileName.substring(0, fileName.lastIndexOf("/"));

/**
 * Returns the portion of a file name after its final dot, or `orElse` if the
 * name has no dot.
 *
 * @example
 * ```ts
 * getExt("archive.tar.gz") == "gz"
 * ```
 *
 * @satisfies {PureFn}
 */
const getExt = (fileName: string, orElse = ""): string => {
  const dot = fileName.lastIndexOf(".") + 1;
  return dot == 0 ? orElse : fileName.slice(dot);
};

/**
 * Replaces the extension of a file name with the provided extension. The
 * provided extension must include the dot.
 *
 * @example
 * ```ts
 * replaceExt("entry.ts", ".out.js") == "entry.out.js"
 * ```
 *
 * @satisfies {PureFn}
 */
const replaceExt = (fileName: string, ext: string): string => {
  const dot = fileName.lastIndexOf(".");
  return dot == -1 ? fileName : fileName.slice(0, dot) + ext;
};

/**
 * Returns the full extension of a file name, including the leading dot.
 *
 * @example
 * ```ts
 * getFullExt("archive.tar.gz") == ".tar.gz"
 * ```
 *
 * @satisfies {PureFn}
 */
const getFullExt = (fileName: string): string => {
  const nameIdx = fileName.lastIndexOf("/");
  return fileName.slice(fileName.indexOf(".", nameIdx));
};

/**
 * Splits a file name into its stem and full extension.
 *
 * @example
 * ```ts
 * splitFullExt("archive.tar.gz") == ["archive", "tar.gz"]
 * ```
 *
 * @satisfies {PureFn}
 */
const splitFullExt = (fileName: string): [string, string] => {
  const slash = fileName.lastIndexOf("/");
  const dot = fileName.indexOf(".", slash);
  const ext = dot < slash ? fileName.length : dot;
  return [fileName.slice(0, ext), fileName.slice(ext + 1)];
};

/**
 * Joins two path fragments and normalizes `.` and `..` segments.
 *
 * @example
 * ```ts
 * combine("src/util", "../crypto/sha3.ts") == "src/crypto/sha3.ts"
 * ```
 *
 * @satisfies {PureFn}
 */
const combine = (basePath: string, subPath: string): string => {
  const parts: string[] = basePath.split("/").concat(subPath.split("/"));
  let j = 0;
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i]!;
    if (part == ".." && j > 0 && parts[j - 1] !== "..") --j;
    else if (part !== "." && part !== "") parts[j++] = part;
  }
  return parts.slice(0, j).join("/");
};

/**
 * Returns the string with its first character uppercased.
 *
 * @example
 * ```ts
 * capitalize("hello") == "Hello"
 * ```
 *
 * @satisfies {PureFn}
 */
const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export {
  capitalize,
  combine,
  getDir,
  getExt,
  getFullExt,
  replaceExt,
  splitFullExt,
};
