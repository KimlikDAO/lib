import { plugin } from "bun";
import { readFileSync } from "node:fs";
import { generatePlacehodler } from "../transpiler/declaration";

plugin({
  name: "kdjs",
  async setup(build) {
    build.onLoad({ filter: /\.d\.ts$/ }, (args) => {
      const content = readFileSync(args.path, "utf8");
      return {
        contents: generatePlacehodler(content),
        loader: "js"
      };
    });
  }
});
