import { file, spawn } from "bun";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";
import { compile } from "../../compiler";

type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

type CompileE2EResult = {
  code: string;
  output: string;
  writtenCode: string;
  cleanup: () => void;
  run: () => Promise<RunResult>;
};

const compileEntry = async (entry: string): Promise<CompileE2EResult> => {
  mkdirSync("tmp", { recursive: true });
  const dir = mkdtempSync("tmp/kdts-e2e-");
  const output = join(dir, basename(entry).replace(/\.ts$/, ".out.js"));
  const code = await compile({ target: [entry], output, strict: true });
  if (typeof code != "string")
    throw new Error(`Expected compile() to return code for ${entry}`);

  const writtenCode = await file(output).text();

  return {
    code,
    output,
    writtenCode,
    cleanup: () => rmSync(dir, { force: true, recursive: true }),
    run: async () => {
      const proc = spawn({
        cmd: [process.execPath, output],
        cwd: process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        (proc.stdout as unknown as Response).text(),
        (proc.stderr as unknown as Response).text(),
        proc.exited,
      ]);
      return { exitCode, stdout, stderr };
    },
  };
};

export { compileEntry };
