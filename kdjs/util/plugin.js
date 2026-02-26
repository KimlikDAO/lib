import { readFileSync } from "node:fs";
import { generatePlaceholder } from "../transpiler/declaration";
import { transpileTs } from "../transpiler/ts";

const kdjsPlugin = {
  name: "kdjs",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const dts = args.path.endsWith(".d.ts");
      if (typeof Bun === "undefined" && !dts) return;
      const contents = readFileSync(args.path, "utf8");
      if (args.path.includes("/node_modules/") || args.path.includes("/kdjs/")) return {
        contents,
        loader: "ts"
      }
      return {
        contents: dts ? generatePlaceholder(contents) : transpileTs(contents),
        loader: "js"
      };
    });
  }
};

export { kdjsPlugin };
