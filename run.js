import { Glob, spawn } from "bun";
import process from "node:process";
import { compile } from "./kdjs/compile";
import { Clear, Green, Red, parseArgs } from "./util/cli";
import { darboğaz as bottleneck } from "./util/promises";

const args = parseArgs(process.argv.slice(2), "command", {
  "-f": "filter",
  "-j": "concurrency"
});

/**
 * @param {string} pattern
 * @param {number} concurrency
 * @return {!Promise<boolean>}
 */
const compileAndRunMatching = async (pattern, concurrency) => {
  const glob = new Glob(pattern);
  const compileTasks = [];
  const combileBN = bottleneck(4);
  const runBN = bottleneck(2);

  for await (const f of glob.scan(".")) {
    if (f.startsWith("build") || f.includes("okuyucu")) continue;
    compileTasks.push(combileBN(() => compile({
      entry: f,
      output: `build/${f}`
    }).then((compiled) =>
      runBN(() => spawn(["bun", "test", "--timeout", "15000", compiled]).exited
        .then((exitCode) => {
          const marker = exitCode == 0 ? `${Green}[OK]` : `${Red}[Fail]`;
          console.log(`${marker}${Clear}, ${exitCode}: ${compiled}`);
          return exitCode;
        })))));
  }

  return Promise.all(compileTasks)
    .then((exitCodes) => exitCodes.every((code) => code == 0));
}

switch (args["command"]) {
  case "test":
    compileAndRunMatching("**/*.test.js").then((allPassed) => {
      if (!allPassed) process.exit(1);
    })
    break;
}
