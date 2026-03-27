import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  createClosureCompilerCommand,
  getJavaJarPath,
  getNativeImagePath,
} from "../closureCompiler";

const params = {
  allFiles: ["entry.js", "dep.js"],
  entryPoint: "",
  isolateDir: "/tmp/kdts-isolate",
  jsCompErrors: ["checkTypes"],
  jsCompWarnings: [],
};

test("getNativeImagePath resolves the macOS native compiler package", () => {
  expect(
    getNativeImagePath(
      "darwin",
      "arm64",
      (path) => path == resolve("node_modules/google-closure-compiler-macos/compiler")
    )
  ).toBe(resolve("node_modules/google-closure-compiler-macos/compiler"));
});

test("getNativeImagePath resolves the Windows compiler executable", () => {
  expect(
    getNativeImagePath(
      "win32",
      "x64",
      (path) => path == resolve("node_modules/google-closure-compiler-windows/compiler.exe")
    )
  ).toBe(resolve("node_modules/google-closure-compiler-windows/compiler.exe"));
});

test("getJavaJarPath resolves the hardcoded java package path", () => {
  expect(
    getJavaJarPath(
      (path) => path == resolve("node_modules/google-closure-compiler-java/compiler.jar")
    )
  ).toBe(resolve("node_modules/google-closure-compiler-java/compiler.jar"));
});

test("createClosureCompilerCommand prefers the native compiler when installed", () => {
  const command = createClosureCompilerCommand(
    params,
    "/tmp/compiler",
    "/tmp/compiler.jar"
  );

  expect(command.cmd[0]).toBe("/tmp/compiler");
  expect(command.platform).toBe("native");
  expect(command.cmd).toContain("--compilation_level=ADVANCED");
  expect(command.cmd).toContain("--warning_level=verbose");
  expect(command.cmd).toContain("--jscomp_error=checkTypes");
  expect(command.cmd).not.toContain("--entry_point=");
});

test("createClosureCompilerCommand falls back to java", () => {
  const command = createClosureCompilerCommand(
    params,
    "",
    "/tmp/compiler.jar"
  );

  expect(command.platform).toBe("java");
  expect(command.cmd.slice(0, 4)).toEqual([
    "java",
    "-XX:+IgnoreUnrecognizedVMOptions",
    "--sun-misc-unsafe-memory-access=allow",
    "-jar",
  ]);
  expect(command.cmd[4]).toBe("/tmp/compiler.jar");
});

test("createClosureCompilerCommand adds the entry point only when present", () => {
  expect(
    createClosureCompilerCommand({
      ...params,
      entryPoint: "entry.js",
    }, "/tmp/compiler", "/tmp/compiler.jar").cmd
  ).toContain("--entry_point=entry.js");
});
