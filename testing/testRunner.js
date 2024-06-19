import { spawn } from "bun";
import { readFile } from "node:fs/promises";
import { Clear, Green, Red } from "../util/cli";
import { darboğaz as bottleneck } from "../util/promises";

/**
 * @param {!Array<string>} files
 * @param {number} concurrency
 * @return {!Promise<boolean>}
 */
const runSimple = (files, concurrency) => {
  const bn = bottleneck(concurrency);
  return Promise.all(
    files.map((file) => readFile(file, "utf8")
      .then((fileContent) => bn(() => spawn(fileContent.includes('"bun:test"')
        ? ["bun", "test", file]
        : ["bun", file]).exited
        .then((exitCode) => {
          const marker = exitCode == 0 ? `${Green}[OK]` : `${Red}[Fail]`;
          console.log(`${marker}${Clear}, ${exitCode}: ${file}`);
          return exitCode;
        })
      ))
    ))
    .then((retValues) => retValues.every((val) => val == 0));
};

export { runSimple };
