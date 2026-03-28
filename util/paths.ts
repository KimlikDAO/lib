/** @pure */
const getDir = (fileName: string): string =>
  fileName.substring(0, fileName.lastIndexOf("/"));

/** @pure */
const getExt = (fileName: string, orElse = ""): string => {
  const dot = fileName.lastIndexOf(".") + 1;
  return dot == 0 ? orElse : fileName.slice(dot);
};

/**
 * Replaces the extension of a file name with the provided extension. The
 * provided extension must include the dot.
 * @pure
 */
const replaceExt = (fileName: string, ext: string): string => {
  const dot = fileName.lastIndexOf(".");
  return dot == -1 ? fileName : fileName.slice(0, dot) + ext;
};

/** @pure */
const getFullExt = (fileName: string): string => {
  const nameIdx = fileName.lastIndexOf("/");
  return fileName.slice(fileName.indexOf(".", nameIdx));
};

/** @pure */
const splitFullExt = (fileName: string): [string, string] => {
  const slash = fileName.lastIndexOf("/");
  const dot = fileName.indexOf(".", slash);
  const ext = dot < slash ? fileName.length : dot;
  return [fileName.slice(0, ext), fileName.slice(ext + 1)];
};

/** @pure */
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

/** @pure */
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
