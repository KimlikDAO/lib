import { PluginBuilder } from "bun";
import { readFileSync } from "node:fs";
import { transpileKdjs } from "../transpiler/jsFromKdjs";

const kdtsPlugin = {
  name: "kdts",
  /** @param {PluginBuilder} build */
  setup(build) {
    build.onLoad({ filter: /^(?!.*\/(?:node_modules|build)\/).*\.js$/ }, (args) => {
      return {
        contents: transpileKdjs(readFileSync(args.path, "utf8")),
        loader: "js"
      };
    });
  }
};

export { kdtsPlugin };
