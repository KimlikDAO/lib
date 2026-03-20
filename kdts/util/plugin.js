import { readFileSync } from "node:fs";
import { transpileKdjs } from "../transpiler/kdjs";

const kdtsPlugin = {
  name: "kdts",
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
