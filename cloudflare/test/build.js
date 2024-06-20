import { compile } from "../../kdjs/compile";

export default compile({
  entry: "cloudflare/test/pageWorker.test.js",
  output: "build/cloudflare/test/pageWorker.test.js"
});
