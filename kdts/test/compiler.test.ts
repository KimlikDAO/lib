import { expect, test } from "bun:test";
import { CliArgs } from "../../util/cli";
import { normalizeCompileArgs } from "../compiler";

test("normalizeCompileArgs merges --overrides and repeated --override flags", () => {
  const args = normalizeCompileArgs(CliArgs.fromArgv([
    "bun",
    "kdts",
    "src/main.ts",
    "--overrides",
    '{"DEBUG":false,"HOST_URL":"https://example.com"}',
    "--override",
    "DEBUG=true",
    "--override",
    "PORTS=[80,443]",
    "--override",
    "HOST_URL=https://override.example",
  ], "target", {}));

  expect(args.asRecord("overrides")).toEqual({
    DEBUG: true,
    HOST_URL: "https://override.example",
    PORTS: [80, 443],
  });
  expect(args.asList("override")).toEqual([]);
});

test("normalizeCompileArgs merges direct compile params without JSON roundtrip", () => {
  const baseOverrides = { DEBUG: false };
  const args = normalizeCompileArgs(CliArgs.from({
    overrides: baseOverrides,
    override: ["DEBUG=true", "HOST_URL=https://override.example"],
  }));

  expect(args.asRecord("overrides")).toEqual({
    DEBUG: true,
    HOST_URL: "https://override.example",
  });
  expect(args.asList("override")).toEqual([]);
  expect(baseOverrides).toEqual({ DEBUG: false });
});

test("normalizeCompileArgs rejects repeated --overrides JSON inputs", () => {
  expect(() => normalizeCompileArgs(CliArgs.fromArgv([
    "bun",
    "kdts",
    "src/main.ts",
    "--overrides",
    '{"A":1}',
    "--overrides",
    '{"B":2}',
  ], "target", {}))).toThrow("Provide at most one --overrides JSON object");
});
