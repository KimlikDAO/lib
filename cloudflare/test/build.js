import { compile } from "../kdc/compile";

export default compile({
  entry: "cloudflare/test/pageWorker.compiled-test.js",
  inputs: [
    "cloudflare/moduleWorker.d.js",
    "cloudflare/pageWorker.d.js",
    "cloudflare/types.d.js",
  ],
  output: "build/cloudflare/test/pageWorker.compiled-test.js"
});
