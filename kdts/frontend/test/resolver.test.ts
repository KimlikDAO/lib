import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePath, resolveRootPath } from "../resolver";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

test("preserves the kdts .d suffix while still resolving js-like source files", () => {
  const cwd = mkdtempSync(join(tmpdir(), "kdts-resolver-"));
  process.chdir(cwd);
  writeFileSync("entry.d.ts", "");

  const resolved = resolveRootPath("entry.d.ts");

  expect(resolved.path).toBe("entry.d.ts");
  expect(resolved.source).toBe("module:entry.d");
});

test("strips regular source extensions before relative resolution", () => {
  const cwd = mkdtempSync(join(tmpdir(), "kdts-resolver-"));
  const srcDir = join(cwd, "src");
  mkdirSync(srcDir);
  writeFileSync(join(srcDir, "dep.ts"), "");
  process.chdir(cwd);

  const resolved = resolvePath("src/main.ts", "./dep.ts");

  expect(resolved.path).toBe("src/dep.ts");
  expect(resolved.source).toBe("module:src/dep");
});
