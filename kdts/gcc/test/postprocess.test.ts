import { expect, test } from "bun:test";
import { ModuleImports } from "../../model/moduleImports";
import { postprocess } from "../postprocess";

test("postprocess rewrites kdts export markers into esm exports", () => {
  const output = postprocess(
    'const a = 1;\n__kdts_export__("answer", a + 1);\n__kdts_export__("default", () => 7);\n',
    new ModuleImports()
  );

  expect(output).toBe(
    "const a = 1;\n" +
    "const __kdts_export_answer = a + 1;\n" +
    "const __kdts_export_default = () => 7;\n" +
    "export { __kdts_export_answer as answer, __kdts_export_default as default };"
  );
});
