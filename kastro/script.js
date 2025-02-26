import { tagYaz } from "../util/html";
import { splitFullExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { Props } from "./props";
import { getGlobals } from "./transpiler/pageGlobals";

/**
 * @param {Props} props
 * @return {!Promise<string>}
 */
const Script = (props) => {
  const [file,] = splitFullExt(props.src);
  const targetName = `/build/${file}-${props.Lang}.js`;
  return Promise.all([].concat(props.children ?? [])).then(() =>
    compiler.bundleTarget(targetName, {
      dynamicDeps: true,
      childTargets: ["/" + props.src], // Used in BuildMode.Dev only
      ...props,
    }).then((bundleName) =>
      tagYaz("script", { type: "module", src: bundleName }, false) + "</script>"
    )
  );
}

const Worker = (props) => {
  const [file,] = splitFullExt(props.src);
  const targetName = `/build/${file}-${props.Lang}.js`;

  return Promise.all([].concat(props.children ?? [])).then(() =>
    compiler.bundleTarget(targetName, {
      printGccOutput: true,
      dynamicDeps: true,
      childTargets: ["/" + props.src], // Used in BuildMode.Dev only
      externs: ["node_modules/@kimlikdao/kdjs/externs/worker.d.js"],
      ...props,
    }).then((bundleName) => {
      const globals = getGlobals();
      if (!globals.Workers) globals.Workers = {};
      globals.Workers[props.src] = bundleName;
    })
  );
}

export { Script, Worker };
