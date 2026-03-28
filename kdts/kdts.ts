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
  --fast         : Use Bun bundler (way faster, but larger output)
  --output (-o)  : The name of the output file
  --print        : Print the compiled code to stdout
  --strict       : Report unknown types
  --loose        : Don't perform strictCheckTypes
  --nologs       : Strip all console.log() calls
  --define       : Values for @define annotated variables
  --isolateDir   : Directory name to write the isolated and preprocessed input files
  --globals      : A JSON encoded object to be used as globals
`);
  process.exit(0);
}

args.setIfMissing("output", replaceExt(entry, ".out.js"));
compile(args);
