import { readFileSync } from "node:fs";
import { generatePlaceholder } from "../transpiler/dts";
import { transpileTs } from "../transpiler/ts";

const kdjsPlugin = {
  name: "kdjs",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const contents = readFileSync(args.path, "utf8");
      if (args.path.includes("/node_modules/")
        || args.path.includes("/kdjs/")
        || args.path.includes("/kastro/kastro.ts"))
        return { contents, loader: "ts" };
      return {
        contents: args.path.endsWith(".d.ts")
          ? generatePlaceholder(contents)
          : transpileTs(contents),
        loader: "js"
      };
    });
  }
};

export { kdjsPlugin };
