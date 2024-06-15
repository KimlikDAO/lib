import { compile } from "../kdc/compile";

export default compile({
  inputs: [
    "cloudflare/test/pageWorker.compiled-test.js",
    "cloudflare/moduleWorker.d.js",
    "cloudflare/pageWorker.d.js",
    "cloudflare/pageWorker.js",
    "cloudflare/types.d.js",
    "kdc/externs/nodejs.d.js",
    "testing/assert.js",
  ],
  output: "build/cloudflare/test/pageWorker.compiled-test.js"
})
