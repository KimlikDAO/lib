import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "./kdjs/compile";
import { Clear, CliArgs, Green, Red, parseArgs } from "./util/cli";
import { darboğaz as bottleneck } from "./util/promises";

/** @const {CliArgs} */
const args = parseArgs(process.argv.slice(2), "command", {
  "-f": "filter",
  "-j": "concurrency",
  "-bj": "buildConcurrency",
  "-rj": "runConcurrency"
});
args["concurrency"] ||= 5;

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
  const runBN = bottleneck(args["buildConcurrency"] || args["concurrency"]);

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
        })))));
  }

  return Promise.all(compileTasks)
    .then((exitCodes) => exitCodes.every((code) => code == 0));
}

const ensureAllPassed = (allPassed) => process.exit(+!allPassed);

switch (args["command"]) {
  case "test":
    compileAndRunMatching("**/*.test.js", "bun test --timeout 50000", args)
      .then(ensureAllPassed);
    break;
  case "bench":
    compileAndRunMatching("**/*.bench.js", "bun", args)
      .then(ensureAllPassed);
    break;
}
