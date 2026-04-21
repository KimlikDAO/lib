import { expect, test } from "bun:test";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { combine, replaceExt } from "../../util/paths";
import { compile } from "../compiler";
import { compileEntry } from "../util/testing/e2e";

test("compile API compiles a.ts and emitted output runs", async () => {
  const entry = relative(
    process.cwd(),
    fileURLToPath(new URL("../showcase/dogCage.ts", import.meta.url))
  );
  const compiled = await compileEntry(entry);

  try {
    expect(compiled.code).toBe(compiled.writtenCode);
    expect(compiled.code).toContain("\"doggy\"");

    const result = await compiled.run();
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim()).toBe("doggy");
  } finally {
    compiled.cleanup();
  }
});

test("compile API restores exported entry bindings as esm exports", async () => {
  mkdirSync("build", { recursive: true });
  const entry = "build/exports.ts";
  const output = "build/exports.out.js";
  writeFileSync(entry, "export default 7;\nexport const answer = 42;\n");

  const code = await compile({ target: [entry], output, strict: true });
  if (typeof code != "string")
    throw new Error(`Expected compile() to return code for ${entry}`);
  const writtenCode = readFileSync(output, "utf8");

  expect(code).not.toContain("__kdts_export__");
  expect(code).not.toContain("kdts_exports");
  expect(writtenCode).not.toContain("__kdts_export__");

  const mod = await import(new URL("../../" + output, import.meta.url).href);
  expect(mod.default).toBe(7);
  expect(mod.answer).toBe(42);
});

test("compile API builds every showcase file", async () => {
  mkdirSync("build", { recursive: true });
  const showcaseDir = relative(
    process.cwd(),
    fileURLToPath(new URL("../showcase", import.meta.url))
  );
  const showcaseEntries = readdirSync(showcaseDir)
    .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".d.ts"))
    .sort();

  for (const fileName of showcaseEntries) {
    const entry = combine(showcaseDir, fileName);
    const output = combine("build", replaceExt(fileName, ".out.js"));
    const code = await compile({ target: [entry], output });
    if (typeof code != "string")
      throw new Error(`Expected compile() to return code for ${fileName}`);
    expect(code).toBe(readFileSync(output, "utf8"));
  }
}, { timeout: 15_000 });
