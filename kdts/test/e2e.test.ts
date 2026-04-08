import { expect, test } from "bun:test";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { compileEntry } from "../util/testing/e2e";

test("compile API compiles a.ts and emitted output runs", async () => {
  const entry = relative(
    process.cwd(),
    fileURLToPath(new URL("./dogCage.ts", import.meta.url))
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
