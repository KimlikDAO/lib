import { parseArgs } from "./util/cli";

const args = parseArgs(process.argv.slice(2), "command", { "-f": "filter" });

/** @const {!Array<string>} */
const Tests = [
  "api",
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
  "crypto",
];

/**
 * @param {!Array<string>} targetFiles
 * @param {string} type
 * @return {!Promise<!Array<string>>}
 */
const buildTargets = (targetFiles, type) => Promise.all(
  targetFiles.map((file) => import(`./${file}/${type}/build`)
    .then((targets) => Array.isArray(targets.default)
      ? Promise.all(targets.default) : targets.default)))
  .then((targets) => targets.flat());

switch (args["command"]) {
  case "test":
    buildTargets(Tests, "test")
      .then(console.log);
    break;
  case "bench":
    buildTargets(Benches, "bench")
      .then(console.log);
    break;
}
