import { PluginBuilder, Transpiler } from "bun";
import { readFileSync } from "node:fs";
import { transpileOverridables } from "../transform/overridable";

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

const makeKdtsOverridablePlugin = (
  overrides: Record<string, unknown>
) => ({
  name: "kdts-overridable",
  setup(build: PluginBuilder) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const contents = readFileSync(args.path, "utf8");
      if (args.path.endsWith(".d.ts") || !contents.includes("Overridable"))
        return { contents, loader: "ts" };
      return {
        contents: transpileOverridables(contents, overrides),
        loader: "ts"
      };
    });
  }
});

export {
  makeKdtsOverridablePlugin,
  kdtsRuntimePlugin
};
