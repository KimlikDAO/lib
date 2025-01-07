import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "../kdjs/compile";
import { Clear, CliArgs, Green, Red, parseArgs } from "../util/cli";
import { darboğaz as bottleneck } from "../util/promises";

/** @const {CliArgs} */
const args = parseArgs(process.argv.slice(2), "target", {
  "-f": "filter",
  "-j": "concurrency",
  "-bj": "buildConcurrency",
  "-rj": "runConcurrency"
});
args["buildConcurrency"] ||= 4;
args["runConcurrency"] ||= 4;

/**
 * @param {!Array<string>} patterns
 * @return {!RegExp}
 */
const createMatcher = (patterns) => {
  const regexPattern = patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(regexPattern);
};

/**
 * @param {string} pattern
 * @param {string} command
 * @param {CliArgs} args
 * @return {!Promise<boolean>}
 */
const compileAndRunMatching = async (pattern, command, args) => {
  const glob = new Glob(pattern);
  const compileTasks = [];
  const compileBN = bottleneck(args["buildConcurrency"] || args["concurrency"]);
  const runBN = bottleneck(args["runConcurrency"] || args["concurrency"]);

  for await (const f of glob.scan(".")) {
    if (filter.test(f)) continue;
    const output = `build/${f}`;
    compileTasks.push(compileBN(() => compile({
      ...args,
      entry: f,
      output
    }).then(() =>
      runBN(() => spawn(command.split(" ").concat(output), {
        stdout: "inherit",
        stderr: "inherit"
      }).exited
        .then((exitCode) => {
          const marker = exitCode == 0 ? `${Green}[OK]` : `${Red}[Fail]`;
          console.log(`${marker}${Clear}, ${exitCode}: ${output}`);
          return exitCode;
        })
      ))
    ));
  }

  return Promise.all(compileTasks)
    .finally((exitCodes) => exitCodes && exitCodes.every((code) => code == 0));
}

const ensureAllPassed = (allPassed) => process.exit(+!allPassed);

const target = args["target"];
const targetPattern = target == "bench"
  ? "**/*.bench.js"
  : typeof target === "string"
    ? (target.endsWith(".js") ? target : `${target}/` + "**/*.test.js")
    : "**/*.test.js";

/** @const {!Array<string>} */
const filter = createMatcher(["build/", "node_modules/"]
  .concat(args["filter"] || []));

const command = targetPattern.includes("bench")
  ? "bun"
  : "bun test";

console.info(`Target: ${targetPattern} (filtering: ${filter})`);
compileAndRunMatching(targetPattern, command, args)
  .then(ensureAllPassed);
