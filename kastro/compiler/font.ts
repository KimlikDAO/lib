import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { getDir } from "../../util/paths";
import { Props } from "../props";
import { Target } from "./target";

const woff2 = (inputFile: string): Promise<number> =>
  spawn({
    cmd: ["woff2_compress", inputFile],
    stdout: "pipe",
    stderr: "pipe",
  }).exited;

const ttfTarget = (
  targetName: string,
  props: Props & { childTargets: Promise<Target>[] }
): Promise<void> => Promise.all(props.childTargets)
  .then(([{ targetName: ttfName }, { targetName: specimenName }]) =>
    mkdir(getDir(targetName.slice(1)), { recursive: true })
      .catch(() => { })
      .then(() =>
        spawn({
          cmd: [
            "pyftsubset",
            ttfName!.slice(1),
            "--no-recommended-glyphs",
            "--no-hinting",
            "--with-zopfli",
            "--canonical-order",
            "--recalc-bounds",
            `--text-file=${specimenName!.slice(1)}`,
            `--output-file=${targetName.slice(1)}`,
          ],
          stdout: "pipe",
          stderr: "pipe",
        }).exited
      )
  )
  .then(() => { });

const woff2Target = (
  targetName: string,
  props: Props & { childTargets: Promise<Target>[] }
): Promise<void> =>
  props.childTargets[0]!.then((childTarget) => {
    const ttfName = childTarget.targetName;
    if (ttfName!.slice(0, -3) !== targetName.slice(0, -5))
      return Promise.reject(
        new Error(`Not supported yet: ${ttfName} != ${targetName}`)
      );
    return woff2(ttfName!.slice(1)).then(() => { });
  });

export { ttfTarget, woff2Target };
