import { spawn } from "bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DiskProgram } from "../model/program";

const NodeModulesDirs = [
  "node_modules",
  "node_modules/.bun/node_modules",
  "kdts/node_modules",
  "kdts/node_modules/.bun/node_modules",
  "node_modules/google-closure-compiler/node_modules",
];
const JavaRuntimeArgs = [
  "-XX:+IgnoreUnrecognizedVMOptions",
  "--sun-misc-unsafe-memory-access=allow",
];

const resolveInstalledPath = (
  packagePath: string,
): string | void => {
  for (const dir of NodeModulesDirs) {
    const installedPath = resolve(`${dir}/${packagePath}`);
    if (existsSync(installedPath))
      return installedPath;
  }
};

const getNativeImagePath = (
  platform = process.platform,
  arch = process.arch,
): string | void => {
  let compilerPackage = "";
  if (platform == "darwin")
    compilerPackage = "google-closure-compiler-macos";
  else if (platform == "win32")
    compilerPackage = "google-closure-compiler-windows";
  else if (platform == "linux")
    compilerPackage = arch == "arm64"
      ? "google-closure-compiler-linux-arm64"
      : "google-closure-compiler-linux";
  else
    return;

  return resolveInstalledPath(
    `${compilerPackage}/${platform == "win32" ? "compiler.exe" : "compiler"}`,
  );
};

const getJavaJarPath = (): string => {
  const javaJarPath = resolveInstalledPath("google-closure-compiler-java/compiler.jar");
  if (!javaJarPath)
    throw new Error("No Closure Compiler jar found in node_modules.");
  return javaJarPath;
};

const createCompilerArgs = (
  program: DiskProgram,
  params: ClosureCompilerParams
): string[] => {
  const args = program.sources.slice();
  args.push(
    "--compilation_level=ADVANCED",
    "--charset=utf-8",
    "--warning_level=verbose",
    "--emit_use_strict=false",
    "--rewrite_polyfills=false",
    "--assume_function_wrapper",
    "--language_in=UNSTABLE",
    "--language_out=UNSTABLE",
    "--chunk_output_type=ES_MODULES",
    "--module_resolution=NODE",
    "--dependency_mode=PRUNE",
    "--jscomp_off=boundedGenerics"
  );

  for (const error of params.jsCompErrors)
    args.push(`--jscomp_error=${error}`);
  for (const warning of params.jsCompWarnings)
    args.push(`--jscomp_warning=${warning}`);
  if (program.entry)
    args.push(`--entry_point=${program.entry}`);

  return args;
};

const createClosureCompilerCommand = (
  program: DiskProgram,
  params: ClosureCompilerParams,
): {
  cmd: string[];
  platform: "native" | "java";
} => {
  const args = createCompilerArgs(program, params);
  const nativeImagePath = getNativeImagePath();
  if (nativeImagePath)
    return {
      cmd: [nativeImagePath, ...args],
      platform: "native"
    };
  const javaJarPath = getJavaJarPath()
  return {
    cmd: ["java", ...JavaRuntimeArgs, "-jar", javaJarPath, ...args],
    platform: "java"
  };
};

type ClosureCompilerParams = {
  jsCompErrors: string[];
  jsCompWarnings: string[];
}

const compileWithClosureCompiler = async (
  program: DiskProgram,
  params: ClosureCompilerParams,
): Promise<string> => {
  const { cmd, platform } = createClosureCompilerCommand(program, params);
  console.info(
    "GCC isolate:   ",
    program.isolateDir,
    `(for ${program.entry})`
  );
  console.info("GCC platform:  ", platform);

  const proc = spawn({
    cmd,
    cwd: program.isolateDir,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [output, errors, exitCode] = await Promise.all([
    (proc.stdout as unknown as Response).text(),
    (proc.stderr as unknown as Response).text(),
    proc.exited
  ]);

  if (exitCode || errors)
    throw `${cmd.join(" ")}\n\n${errors || exitCode}\n\n`;
  return output;
};

export {
  compileWithClosureCompiler,
  createClosureCompilerCommand,
  getJavaJarPath,
  getNativeImagePath
};
