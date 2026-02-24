#!/usr/bin/env node

import process from "node:process";
import { parseArgs } from "../util/cli";
import { compile } from "./compile";

const params = parseArgs(process.argv.slice(2), "entry", {
  "-o": "output",
  "-d": "exports",
});

if (typeof params["entry"] != "string") {
  console.log(`kdjs 0.0.1

Usage: kdjs entry.js [parameters]

Parameters:
  --output (-o)  : The name of the output file
  --print        : Print the compiled code to stdout
  --strict       : Report unknown types
  --loose        : Don't perform strictTypeCheck
  --nologs       : Strip all console.log() calls
  --define       : Values for @define annotated variables
  --isolateDir   : Directory name to write the isolated and preprocessed input files
  --emit_shebang : Whether to place bun shebang sequence at the beginning of the output
  --globals      : A JSON encoded object to be used as globals
`);
  process.exit(0);
}

params["output"] ||= /** @type {string} */(params["entry"])
  .replace(/\.(js|ts)$/, ".out.js");

compile(params);
