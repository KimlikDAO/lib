import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { combine } from "../../../util/paths";
import { GccProgram } from "../gccProgram";

test("plain entries stay unchanged", async () => {
  mkdirSync("tmp", { recursive: true });
  const dir = mkdtempSync("tmp/gcc-program-");
  const isolateDir = combine(dir, ".kdts_isolate");
  const entryPath = combine(dir, "entry.ts");
  const entry = relative(process.cwd(), entryPath);
  writeFileSync(entryPath, "console.log(1);\n");

  try {
    const program = await GccProgram.from(entry, {}, [], isolateDir);

    expect(program.entry).toBe(entry);
    expect(program.sources).toEqual([entry]);
    expect(program.exports.names).toEqual([]);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test("exported entries materialize a sibling extern file", async () => {
  mkdirSync("tmp", { recursive: true });
  const dir = mkdtempSync("tmp/gcc-program-");
  const isolateDir = combine(dir, ".kdts_isolate");
  const entryPath = combine(dir, "entry.ts");
  const entry = relative(process.cwd(), entryPath);
  const wrapperPath = entry.replace(/\.ts$/, ".entry.ts");
  const externPath = entry.replace(/\.ts$/, ".entry.d.ts");
  writeFileSync(entryPath, "export default 7;\nexport const answer = 42;\n");

  try {
    const program = await GccProgram.from(entry, {}, [], isolateDir);

    expect(program.entry).toBe(wrapperPath);
    expect(program.sources).toEqual([externPath, wrapperPath, entry]);
    expect(program.exports.names).toEqual(["answer", "default"]);
    expect(readFileSync(combine(isolateDir, wrapperPath), "utf8")).toBe(
      'import kdts_export_default, { answer as kdts_export_answer } from "./entry.ts";\n' +
      '\n' +
      '__kdts_export__("default", kdts_export_default);\n' +
      '__kdts_export__("answer", kdts_export_answer);\n'
    );
    expect(readFileSync(combine(isolateDir, externPath), "utf8")).toBe(
      "/** @fileoverview @externs */\n" +
      "function __kdts_export__(name, value) {}\n"
    );
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
