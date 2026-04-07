#!/usr/bin/env bun

import process from "node:process";
import { parseArgs } from "../util/cli";
import { compile } from "./compiler";
import { run } from "./runner";

const args = parseArgs(process.argv.slice(2), "target", {
  "-o": "output",
  "-d": "exports",
  "-f": "filter",
  "-j": "concurrency",
  "-bj": "buildConcurrency",
  "-rj": "runConcurrency"
});

function usage() {
  console.log(`kdts 0.0.x

Usage:
  kdts <entry> [options]
  kdts compile <entry> [options]
  kdts run <entry> [options]
  kdts test [target] [options]
  kdts bench [target] [options]

Default command:
  If no command is given, \`compile\` is assumed.
  
Commands:
  compile    Compile an entry file to JavaScript
             This is also the default when no command is given.
  run        Compile an entry file, then run the compiled output
  test       Compile matching test files, then run them
  bench      Compile matching bench files, then run them

Arguments:
  <entry>    Entry file to compile or run
  [target]   File, directory, or pattern for test/bench discovery

General options:
  --fast              Use the fast compilation path
  --strict            Report unknown types
  --loose             Disable strict type checking
  --override KEY=VAL  Override a \`satisfies Overridable\` binding
  --overrides JSON    JSON object of override values
  --isolateDir DIR    Directory for isolated preprocessed files

Compile/run options:
  -o, --output FILE   Output file path
                      default: <entry>.ts -> <entry>.out.js
  --print             Print compiled code to stdout
  --nologs            Strip console.log() calls
  --packages MODE     "external" or "bundle"
  --external PKG      Package to keep external when bundling

Test/bench options:
  -f, --filter PATH   Exclude matching paths
  -j, --concurrency N Total concurrency
  --buildConcurrency N
  --runConcurrency N

Examples:
  kdts src/main.ts
  kdts compile src/main.ts --fast
  kdts run src/main.ts --override DEBUG=true
  kdts test
  kdts test crypto
  kdts bench util/hex
`);
  process.exit(0);
}

const verb = args.asStringOr("target", "");

if(args.isTrue("help"))
  usage();

if (verb == "compile" || verb.endsWith(".js") || verb.endsWith(".ts"))
  compile(args);
else if (["run", "test", "bench"].includes(verb))
  run(args);
else
  usage();
