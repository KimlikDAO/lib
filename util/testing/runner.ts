import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "../../kdjs/compile";
import { Clear, CliArgs, Green, Red, asList, parseArgs } from "../cli";
import { replaceExt } from "../paths";
import { Throttle } from "../promises";

const args: CliArgs = parseArgs(process.argv.slice(2), "target", {
  "-f": "filter",
  "-j": "concurrency",
  "-bj": "buildConcurrency",
  "-rj": "runConcurrency"
});
args["buildConcurrency"] ||= "4";
args["runConcurrency"] ||= "4";

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
    +args["buildConcurrency"] || +args["concurrency"]);
  const runBN = new Throttle(
    +args["runConcurrency"] || +args["concurrency"]);

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

    compileTasks.push(
      compileBN.add(() =>
        compile({ ...args, entry: file, output })
          .then(run))
    );
  }
  return Promise.all(compileTasks)
    .then((exitCodes: number[]) =>
      exitCodes.every((code: number) => code == 0));
};

const ensureAllPassed = (allPassed: boolean) => process.exit(+!allPassed);

const target = args["target"];
const include =
  target == "bench"
    ? "**/*.bench.{js,ts}"
    : typeof target == "string"
      ? target.endsWith(".js") || target.endsWith(".ts")
        ? target
        : `${target}/` + "**/*.test.{js,ts}"
      : "**/*.test.{js,ts}";

const exclude: RegExp = createMatcher(
  ["build/", "node_modules/"].concat(asList(args, "filter")),
);

const command = include.includes("bench") ? "bun" : "bun test";

console.info(`Target: ${include} (filtering: ${exclude})`);
compileAndRunMatching(include, exclude, command, args).then(ensureAllPassed);
