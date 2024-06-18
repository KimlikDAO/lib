import { compile } from "../../kdc/compile";

export default compile({
  entry: "cloudflare/test/pageWorker.compiled-test.js",
  externs: [
    "cloudflare/moduleWorker.d.js",
    "cloudflare/pageWorker.d.js",
    "cloudflare/types.d.js",
  ],
  output: "build/cloudflare/test/pageWorker.compiled-test.js"
});
