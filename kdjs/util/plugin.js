import { readFileSync } from "node:fs";
import { generatePlaceholder } from "../transpiler/declaration";

const kdjsPlugin = {
  name: "kdjs",
  setup(build) {
    build.onLoad({ filter: /\.d\.ts$/ }, (args) => ({
      contents: generatePlaceholder(readFileSync(args.path, "utf8")),
      loader: "js"
    }));
  }
};

export { kdjsPlugin };
