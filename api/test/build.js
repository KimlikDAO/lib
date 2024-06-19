import { compile } from "../../kdc/compile";

export default compile({
  entry: "api/test/jsonrpc.test.js",
  externs: ["api/jsonrpc.d.js"],
  output: "build/api/test/jsonrpc.test.js",
});
