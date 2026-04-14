import { PluginBuilder, Transpiler } from "bun";
import { readFileSync } from "node:fs";

const kdtsRuntimePlugin = {
  name: "kdts-runtime",
  setup(build: PluginBuilder) {
    const transpiler = new Transpiler({
      loader: "js",
      trimUnusedImports: true,
    });
    build.onLoad({ filter: /^(?!.*\/(?:node_modules|build)\/).*\.js$/ }, (args) => {
      return {
        contents: transpiler.transformSync(readFileSync(args.path, "utf8")),
        loader: "js"
      };
    });
  }
};

export { kdtsRuntimePlugin };
