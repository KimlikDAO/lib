import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "../../kdts/compile";
import { Clear, CliArgs, Green, Red, parseArgs } from "../cli";
import { replaceExt } from "../paths";
import { Throttle } from "../promises";

const args: CliArgs = parseArgs(process.argv.slice(2), "target", {
  "-f": "filter",
  "-j": "concurrency",
  "-bj": "buildConcurrency",
  "-rj": "runConcurrency"
});

const createMatcher = (patterns: string[]): RegExp => {
  const regexPattern = patterns
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(regexPattern);
};

const compileAndRunMatching = async (
  include: string,
  exclude: RegExp,
  command: string,
  args: CliArgs,
): Promise<boolean> => {
  const glob = new Glob(include);
  const compileTasks: Promise<number>[] = [];
  const compileBN = new Throttle(
    +args.asStringOr("buildConcurrency", "4"));
  const runBN = new Throttle(
    +args.asStringOr("runConcurrency", "4"));

  for await (const file of glob.scan(".")) {
    if (exclude.test(file)) continue;
    const output = "build/" + replaceExt(file, ".js");
    const run = () =>
      runBN.add(() =>
        spawn(command.split(" ").concat(output), {
          stdout: "inherit",
          stderr: "inherit",
        }).exited.then((exitCode: number) => {
          const marker = exitCode == 0 ? `${Green}[OK]` : `${Red}[Fail]`;
          console.info(`${marker}${Clear}, ${exitCode}: ${output}`);
          return exitCode;
        })
      );

    compileTasks.push(compileBN.add(() =>
      compile(args.fork({ entry: file, output })).then(run)));
  }
  return Promise.all(compileTasks)
    .then((exitCodes: number[]) =>
      exitCodes.every((code: number) => code == 0));
};

const ensureAllPassed = (allPassed: boolean) => process.exit(+!allPassed);

const getIncludes = (target: string[]) => {
  const [mode, pattern] = target;
  if (!pattern) return `**/*.${mode}.{js,ts}`;
  if (!pattern.endsWith(".js") && !pattern.endsWith(".ts"))
    return `${pattern}/**/*.${mode}.{js,ts}`;
  return pattern;
};

const include = getIncludes(args.asList("target"));
const exclude: RegExp = createMatcher(
  ["build/", "node_modules/"].concat(args.asList("filter")));
const command = include.includes(".bench.") ? "bun" : "bun test";

console.info(`Target: ${include} (filtering: ${exclude})`);
compileAndRunMatching(include, exclude, command, args).then(ensureAllPassed);
