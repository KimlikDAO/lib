import { compile } from "../../kdc/compile";

export default compile({
  entry: "api/test/jsonrpc.compiled-test.js",
  externs: ["api/jsonrpc.d.js"],
  output: "build/api/test/jsonrpc.compiled-test.js",
});
