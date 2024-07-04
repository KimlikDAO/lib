import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "./kdjs/compile";
import { Clear, CliArgs, Green, Red, parseArgs } from "./util/cli";
import { darboğaz as bottleneck } from "./util/promises";

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
    if (f.startsWith("build") || f.includes("okuyucu")) continue;
    compileTasks.push(compileBN(() => compile({
      entry: f,
      output: `build/${f}`
    }).then((compiled) =>
      runBN(() => spawn(command.split(" ").concat(compiled)).exited
        .then((exitCode) => {
          const marker = exitCode == 0 ? `${Green}[OK]` : `${Red}[Fail]`;
          console.log(`${marker}${Clear}, ${exitCode}: ${compiled}`);
          return exitCode;
        })
      ))
    ));
  }

  return Promise.all(compileTasks)
    .finally((exitCodes) => exitCodes && exitCodes.every((code) => code == 0));
}

const ensureAllPassed = (allPassed) => process.exit(+!allPassed);

const testCommand = "bun test --timeout 100000";
const benchCommad = "bun";

let target = args["target"];
if (target == "test") target = "**/*.test.js";
else if (target == "bench") target = "**/*.bench.js";

compileAndRunMatching(target, target.includes("bench") ? benchCommad : testCommand, args)
  .then(ensureAllPassed);
