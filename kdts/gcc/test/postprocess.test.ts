import { expect, test } from "bun:test";
import { ModuleExports } from "../../model/moduleExports";
import { ModuleImports } from "../../model/moduleImports";
import { postprocess } from "../postprocess";

const makeProgram = (names: string[]) => ({
  entry: "test.ts",
  sources: ["test.ts"],
  imports: new ModuleImports(),
  exports: new ModuleExports(names),
});

test("postprocess rewrites kdts export markers into esm exports", () => {
  const output = postprocess(
    'const a = 1;\n__kdts_export__("answer", a + 1);\n__kdts_export__("default", () => 7);\n',
    makeProgram(["answer", "default"])
  );

  expect(output).toBe(
    "const a = 1;\n" +
    "const __kdts_export_answer = a + 1;\n" +
    "const __kdts_export_default = () => 7;\n" +
    "export{__kdts_export_answer as answer,__kdts_export_default as default}"
  );
});

test("postprocess rewrites a lone default export marker directly", () => {
  const output = postprocess(
    'const a = 1;\n__kdts_export__("default", a + 1);\n',
    makeProgram(["default"])
  );

  expect(output).toBe(
    "const a = 1;\n" +
    "export default a + 1;\n"
  );
});
