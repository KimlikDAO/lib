import { ModuleImports } from "../model/moduleImports";
import { generateEsmImports } from "./generator";

const postprocess = (
  content: string,
  unlinkedImports: ModuleImports
): string => {
  return generateEsmImports(unlinkedImports) + content;
};

export { postprocess };
