import { readFileSync } from "node:fs";
import { generatePlaceholder } from "../transpiler/dts";
import { transpileTs } from "../transpiler/ts";

const kdjsPlugin = {
  name: "kdjs",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const path = args.path;
      const contents = readFileSync(path, "utf8");
      if (path.includes("/node_modules/")
        || path.includes("/kdjs/")
        || path.endsWith("/kastro/kastro.ts"))
        return { contents, loader: "ts" };
      return {
        contents: path.endsWith(".d.ts")
          ? generatePlaceholder(contents)
          : transpileTs(contents),
        loader: "js"
      };
    });
  }
};

export { kdjsPlugin };
