import { minify } from "csso";

const stylesheetTarget = (_, props) =>
  Promise.all(props.childTargets)
    .then((targets) => minify(targets.map(t => t.content).join("\n")).css)

export { stylesheetTarget };
