#!/usr/bin/env node

import { parseArgs } from "../util/cli";
import { compile } from "./compile";

const params = parseArgs(process.argv.slice(2), "entry", {
  "-o": "output",
  "-d": "exports",
});
params["output"] ||= params["entry"].replace(/\.js$/, "") + ".out.js";

compile(params);
