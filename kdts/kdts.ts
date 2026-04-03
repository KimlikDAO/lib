import process from "node:process";
import { parseArgs } from "../util/cli";
import { replaceExt } from "../util/paths";
import { compile } from "./compile";

const args = parseArgs(process.argv.slice(2), "entry", {
  "-o": "output",
  "-d": "exports",
});

const entry = args.asStringOr("entry", "");
if (!entry) {
  console.log(`kdts 0.0.3

Usage: kdts entry.js [parameters]

Parameters:
  --output (-o)  : Output file name
                   default: entry.js -> entry.out.js
  --fast         : Compile without using the type info
                   Uses bun bundler on bun, esbuild on node
  --print        : Print the compiled code to stdout
  --nologs       : Strip all console.log() calls
  --override     : Value for a \`satisfies Overridable\` annotated variable
                   example: --override DEBUG=true
  --overrides    : A JSON encoded object to be used for variable overrides
  --packages     : "external" or "bundle"
  --external     : If packages is set to bundle, a list of package names to
                   consider external

Parameters (typed mode only):
  --strict       : Report unknown types
  --loose        : Don't perform strictCheckTypes
  --isolateDir   : Directory name to write the isolated and preprocessed input files
`);
  process.exit(0);
}

args.setIfMissing("output", replaceExt(entry, ".out.js"));
compile(args);
