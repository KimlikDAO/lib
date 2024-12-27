import { minify } from "csso";

const Decoder = new TextDecoder();

const stylesheetTarget = (_, props) =>
  Promise.all(props.childTargets)
    .then((targets) => {
      return minify(targets.map((t) => Decoder.decode(t.content)).join("")).css;
    })

export { stylesheetTarget };
