import { spawn } from "bun";
import { parseArgs } from "./util/cli";
import { darboğaz as bottleneck } from "./util/promises";

const args = parseArgs(process.argv.slice(2), "command", { "-f": "filter" });

/** @const {!Array<string>} */
const Tests = [
  "api",
  "cloudflare",
  "crosschain",
  "crypto",
  "did",
  "ethereum",
  "ethereum/evm",
  "mina",
  "node",
  "util",
];

/** @const {!Array<string>} */
const Benches = [
  "crypto"
];

/**
 * @param {!Array<string>} files
 * @return {!Promise<boolean>}
 */
const runSimple = (files) => {
  files = files.filter((file) => !file.includes("ipfs"));
  const bn = bottleneck(6);
  return Promise.all(
    files.map((file) =>
      bn(() =>
        spawn(["bun", file]).exited.then((exitCode) => {
          console.log(`${file} with exit code ${exitCode}`);
          return exitCode;
        })
      )
    )
  ).then((retValues) => retValues.every((val) => val == 0));
};

/**
 * @param {!Array<string>} targetFiles
 * @param {string} type
 * @return {!Promise<!Array<string>>}
 */
const buildTargets = (targetFiles, type) =>
  Promise.all(
    targetFiles.map((file) =>
      import(`./${file}/${type}/build`).then((targets) =>
        Array.isArray(targets.default)
          ? Promise.all(targets.default)
          : targets.default
      )
    )
  ).then((targets) => targets.flat());

switch (args["command"]) {
  case "test":
    buildTargets(Tests, "test")
      .then(runSimple)
      .then((success) => process.exit(1 - +success));
    break;
  case "bench":
    buildTargets(Benches, "bench")
      .then(runSimple)
      .then((success) => process.exit(1 - +success));
    break;
  case "pp":
    runSimple(["node/test/ipfs.compiled-test.js"]);
}
