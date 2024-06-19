import { runSimple } from "./testing/testRunner";
import { parseArgs } from "./util/cli";

const args = parseArgs(process.argv.slice(2), "command", {
  "-f": "filter",
  "-j": "concurrency"
});

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

/**
 * Run at most `args["concurrency"]` tests in parallel.
 *
 * @const {number}
 */
const concurrency = args["concurrency"] || 6;

switch (args["command"]) {
  case "test":
    buildTargets(Tests, "test")
      .then((files) => runSimple(
        files.filter((file) => !file.includes("ipfs")), concurrency))
      .then((success) => process.exit(1 - +success));
    break;
  case "bench":
    buildTargets(Benches, "bench")
      .then((files) => runSimple(files, concurrency))
      .then((success) => process.exit(1 - +success));
    break;
}
